FROM gradle:8.10-jdk21 AS build
WORKDIR /app
COPY . .
RUN ./gradlew installDist --no-daemon

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/build/install/german-conjugator-backend ./
EXPOSE 8080
CMD ["./bin/german-conjugator-backend"]
