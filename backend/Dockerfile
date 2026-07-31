# Step 1: Build the jar using Maven image
FROM maven:3.8.5-openjdk-17 AS build
WORKDIR /app

# Copy pom.xml and download dependencies
COPY pom.xml .
RUN mvn dependency:go-offline

# Copy source code and build final jar file
COPY src ./src
RUN mvn clean package -DskipTests

# Step 2: Run the app using JDK runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copy built artifact from build stage
COPY --from=build /app/target/*.jar app.jar

# Expose server port
EXPOSE 8080

# Start application
ENTRYPOINT ["java", "-jar", "app.jar"]