# JVM build for local development
FROM docker.io/library/eclipse-temurin:25-jdk AS build
WORKDIR /workspace

# Copy only the app sources (context will be apps/backend)
COPY .mvn .mvn
COPY --chmod=0755 mvnw mvnw
COPY pom.xml .
COPY checkstyle checkstyle
COPY src src

RUN ./mvnw -B -DskipTests package

# Normalize produced jar to a known location. Prefer the Quarkus run jar if present.
RUN set -eux; \
		if [ -f target/quarkus-app/quarkus-run.jar ]; then \
			cp target/quarkus-app/quarkus-run.jar application.jar; \
		else \
			JAR=$(ls target/*.jar | grep -v "original" | head -n1) && cp "$JAR" application.jar; \
		fi

FROM docker.io/library/eclipse-temurin:25-jre AS runtime
WORKDIR /work
# Install curl so the docker-compose healthcheck can call Quarkus HTTP health endpoint
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
# Copy the full Quarkus application layout so that quarkus-run.jar can load classes from lib/
COPY --from=build /workspace/target/quarkus-app/ /work/

EXPOSE 8080
# Run the Quarkus runner jar from the quarkus-app directory
CMD ["java","-jar","/work/quarkus-run.jar"]