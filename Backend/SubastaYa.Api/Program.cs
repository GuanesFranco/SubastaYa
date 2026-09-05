using System.Diagnostics;
using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SubastaYa.Api.Middleware;
using SubastaYa.Application.Interfaces;
using SubastaYa.Application.UseCases.Users.Commands;
using SubastaYa.Application.UseCases.Users.Queries;
using SubastaYa.Application.UseCases.Wallets.Commands;
using SubastaYa.Application.UseCases.Wallets.Queries;
using SubastaYa.Infrastructure.Auth;
using SubastaYa.Infrastructure.Persistence;
using SubastaYa.Infrastructure.Persistence.Repositories;
using SubastaYa.Application.UseCases.Categories.Queries;
using SubastaYa.Application.UseCases.Auctions.Commands;
using SubastaYa.Application.UseCases.Auctions.Queries;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddProblemDetails();

builder.Services.AddSwaggerGen(c =>
{
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Ingresa el token JWT"
    });
    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddDbContext<SubastaYaDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<IUsuarioRepository, UsuarioRepository>();
builder.Services.AddScoped<IBilleteraRepository, BilleteraRepository>();
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddSingleton<IPasswordHasher, BCryptPasswordHasher>();
builder.Services.AddSingleton<IJwtProvider, JwtProvider>();

builder.Services.AddScoped<RegistrarUsuarioCommandHandler>();
builder.Services.AddScoped<LoginQueryHandler>();
builder.Services.AddScoped<GetWalletBalanceQueryHandler>();
builder.Services.AddScoped<DepositCommandHandler>();
builder.Services.AddScoped<GetWalletTransactionsQueryHandler>();

builder.Services.AddScoped<ICategoriaRepository, CategoriaRepository>();
builder.Services.AddScoped<ISubastaRepository, SubastaRepository>();
builder.Services.AddScoped<IAuditoriaLogRepository, AuditoriaLogRepository>();
builder.Services.AddScoped<ListarCategoriasQueryHandler>();
builder.Services.AddScoped<CrearSubastaCommandHandler>();
builder.Services.AddScoped<ListarSubastasQueryHandler>();
builder.Services.AddScoped<ObtenerSubastaQueryHandler>();
builder.Services.AddScoped<ListarPujasQueryHandler>();
builder.Services.AddScoped<ListarMisSubastasQueryHandler>();
builder.Services.AddScoped<RealizarPujaCommandHandler>();
builder.Services.AddScoped<ListarMisPujasQueryHandler>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Secret"]!))
        };

        options.Events = new JwtBearerEvents
        {
            OnChallenge = async contexto =>
            {
                contexto.HandleResponse();

                if (contexto.Response.HasStarted)
                {
                    return;
                }

                var problema = new ProblemDetails
                {
                    Status = StatusCodes.Status401Unauthorized,
                    Title = "No autenticado",
                    Detail = "Falta el token de acceso o ya no es válido.",
                    Instance = contexto.Request.Path
                };

                problema.Extensions["traceId"] = Activity.Current?.Id ?? contexto.HttpContext.TraceIdentifier;

                contexto.Response.ContentType = "application/problem+json";
                contexto.Response.StatusCode = StatusCodes.Status401Unauthorized;

                await contexto.Response.WriteAsJsonAsync(problema);
            },
            OnForbidden = async contexto =>
            {
                if (contexto.Response.HasStarted)
                {
                    return;
                }

                var problema = new ProblemDetails
                {
                    Status = StatusCodes.Status403Forbidden,
                    Title = "Acceso denegado",
                    Detail = "El token es válido pero no habilita esta operación.",
                    Instance = contexto.Request.Path
                };

                problema.Extensions["traceId"] = Activity.Current?.Id ?? contexto.HttpContext.TraceIdentifier;

                contexto.Response.ContentType = "application/problem+json";
                contexto.Response.StatusCode = StatusCodes.Status403Forbidden;

                await contexto.Response.WriteAsJsonAsync(problema);
            }
        };
    });

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<SubastaYaDbContext>();
    dbContext.Database.Migrate();
}

app.UseMiddleware<ExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();

