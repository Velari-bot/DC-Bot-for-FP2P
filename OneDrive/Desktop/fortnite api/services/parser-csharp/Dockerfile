FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 5000

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["ParserService.csproj", "./"]
RUN dotnet restore "ParserService.csproj"
COPY . .
WORKDIR "/src"
RUN dotnet build "ParserService.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "ParserService.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "ParserService.dll"]
