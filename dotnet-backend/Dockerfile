FROM mcr.microsoft.com/dotnet/sdk:9.0-alpine AS build
WORKDIR /src

COPY Javaline.Commercial.sln ./
COPY src/Javaline.Commercial.Domain/Javaline.Commercial.Domain.csproj             src/Javaline.Commercial.Domain/
COPY src/Javaline.Commercial.Application/Javaline.Commercial.Application.csproj   src/Javaline.Commercial.Application/
COPY src/Javaline.Commercial.Infrastructure/Javaline.Commercial.Infrastructure.csproj src/Javaline.Commercial.Infrastructure/
COPY src/Javaline.Commercial.Api/Javaline.Commercial.Api.csproj                   src/Javaline.Commercial.Api/

RUN dotnet restore

COPY . .
RUN dotnet publish src/Javaline.Commercial.Api/Javaline.Commercial.Api.csproj \
    -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:9.0-alpine AS runtime
WORKDIR /app

RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001 -G appgroup
COPY --from=build --chown=appuser:appgroup /app/publish .

USER appuser
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

ENTRYPOINT ["dotnet", "Javaline.Commercial.Api.dll"]
