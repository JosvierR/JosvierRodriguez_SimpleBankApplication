FROM eclipse-temurin:17-jdk-jammy AS build
WORKDIR /workspace

COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw -q -DskipTests dependency:go-offline

COPY src src
RUN ./mvnw -q -DskipTests package

FROM eclipse-temurin:17-jre-jammy AS runtime
RUN groupadd --system bankapp && useradd --system --gid bankapp --home-dir /app bankapp
WORKDIR /app
COPY --from=build --chown=bankapp:bankapp /workspace/target/*.jar app.jar
USER bankapp
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
