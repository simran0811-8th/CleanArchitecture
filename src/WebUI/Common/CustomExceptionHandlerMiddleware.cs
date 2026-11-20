using CleanArchitecture.Application.Common.Exceptions;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Text.Json;
using System.Threading.Tasks;

namespace CleanArchitecture.WebUI.Common
{
    public class CustomExceptionHandlerMiddleware
    {
        private readonly RequestDelegate _next;

        public CustomExceptionHandlerMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task Invoke(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                await HandleExceptionAsync(context, ex);
            }
        }

        private Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            ProblemDetails problem;

            switch (exception)
            {
                case ValidationException validationException:
                    problem = new ValidationProblemDetails(validationException.Failures)
                    {
                        Type = "https://tools.ietf.org/html/rfc7231#section-6.5.1",
                        Title = "One or more validation errors occurred.",
                        Status = StatusCodes.Status400BadRequest,
                    };
                    break;
                case NotFoundException _:
                    problem = new ProblemDetails
                    {
                        Type = "https://tools.ietf.org/html/rfc7231#section-6.5.4",
                        Title = "The specified resource was not found.",
                        Status = StatusCodes.Status404NotFound,
                        Detail = exception.Message,
                    };
                    break;
                default:
                    problem = new ProblemDetails
                    {
                        Type = "https://tools.ietf.org/html/rfc7231#section-6.6.1",
                        Title = "An error occurred while processing your request.",
                        Status = StatusCodes.Status500InternalServerError,
                    };
                    break;
            }

            context.Response.ContentType = "application/problem+json";
            context.Response.StatusCode = problem.Status.Value;

            var result = JsonSerializer.Serialize(
                problem,
                problem.GetType(),
                new JsonSerializerOptions { IgnoreNullValues = true });

            return context.Response.WriteAsync(result);
        }
    }

    public static class CustomExceptionHandlerMiddlewareExtensions
    {
        public static IApplicationBuilder UseCustomExceptionHandler(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<CustomExceptionHandlerMiddleware>();
        }
    }
}
