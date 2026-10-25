# Used by Render.
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -q -B dependency:go-offline
COPY src src
RUN mvn -q -B package -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/careerbridge-0.0.1-SNAPSHOT.jar app.jar
# Whatever runs this image is reachable by anyone (ADR-0006)
ENV PUBLIC_DEPLOYMENT=true
# No administrator unless the host sets ADMIN_PASSWORD (ADR-0007)
ENV ADMIN_PASSWORD=""
# The H2 console is for the local fallback database only (ADR-0009)
ENV SPRING_H2_CONSOLE_ENABLED=false
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
