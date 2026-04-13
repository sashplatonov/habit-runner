FROM eclipse-temurin:25-jdk AS build
WORKDIR /workspace

COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN chmod +x mvnw

COPY src src
RUN ./mvnw -B -DskipTests package -Pnative

FROM quay.io/quarkus/quarkus-micro-image:2.0
WORKDIR /work/
COPY --from=build /workspace/target/*-runner /work/application

EXPOSE 3000
ENV QUARKUS_HTTP_HOST=0.0.0.0
# Metrics are scraped by an external Grafana Agent on the host (recommended).
# Do not bake Grafana Cloud or OTLP secrets into the container image.

ENTRYPOINT ["./application", "-Dquarkus.http.host=0.0.0.0"]