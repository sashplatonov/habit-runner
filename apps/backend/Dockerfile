ARG MANDREL_BUILDER_IMAGE=quay.io/quarkus/ubi9-quarkus-mandrel-builder-image:jdk-25
FROM ${MANDREL_BUILDER_IMAGE} AS build
WORKDIR /workspace

# Copy only the parts needed for a reproducible build (context: apps/backend)
COPY .mvn/ .mvn/
COPY mvnw ./mvnw
COPY pom.xml ./pom.xml
COPY src ./src

RUN chmod +x mvnw
# Build native image. The default MANDREL_BUILDER_IMAGE targets JDK 25 and
# includes Mandrel's native-image toolchain; if you need a different image,
# override `MANDREL_BUILDER_IMAGE` via build-arg.
RUN sh ./mvnw -DskipTests -Dnative package

FROM quay.io/quarkus/quarkus-micro-image:2.0
WORKDIR /work/
COPY --from=build /workspace/target/*-runner /work/application

EXPOSE 8080
CMD ["/work/application", "-Dquarkus.http.host=0.0.0.0"]