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
# Grafana Cloud / OpenTelemetry env placeholders (set at runtime; do NOT hardcode secrets)
ENV OTEL_EXPORTER_OTLP_ENDPOINT=""
ENV OTEL_EXPORTER_OTLP_HEADERS=""
ENV OTEL_RESOURCE_ATTRIBUTES=""
ENV GRAFANA_CLOUD_API_KEY=""

ENTRYPOINT ["./application", "-Dquarkus.http.host=0.0.0.0"]