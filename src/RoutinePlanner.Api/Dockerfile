
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["src/RoutinePlanner.Api/RoutinePlanner.Api.csproj", "src/RoutinePlanner.Api/"]
RUN dotnet restore "src/RoutinePlanner.Api/RoutinePlanner.Api.csproj"

COPY . .
WORKDIR /src/src/RoutinePlanner.Api
RUN dotnet publish "RoutinePlanner.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

COPY --from=build /app/publish .
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "RoutinePlanner.Api.dll"]
