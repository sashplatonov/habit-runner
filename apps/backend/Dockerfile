# syntax=docker/dockerfile:1.7
# JVM build for local development
FROM docker.io/library/eclipse-temurin:25-jdk AS build
WORKDIR /workspace

# Keep the API build bounded when Dokploy builds API and web images together.
ENV MAVEN_OPTS="-Xms256m -Xmx1024m -XX:ActiveProcessorCount=1"

# Copy build metadata first so Maven dependencies can stay cached across source changes.
COPY .mvn .mvn
COPY --chmod=0755 mvnw mvnw
COPY pom.xml .
COPY checkstyle checkstyle
COPY pmd pmd

RUN --mount=type=cache,target=/root/.m2 ./mvnw -B -T1 -Dmaven.test.skip=true dependency:go-offline

# Copy application sources after dependency warmup to avoid invalidating the cache on every change.
COPY src src

# CI runs Checkstyle, PMD, and SpotBugs. Skip those analysis-only plugins here so
# the deployment image build only compiles and packages the application.
RUN --mount=type=cache,target=/root/.m2 ./mvnw -B -T1 -Djacoco.skip=true -Dcheckstyle.skip=true -Dpmd.skip=true -Dspotbugs.skip=true -Dmaven.test.skip=true -Dtest.jvm.argline.extra="-Xms256m -Xmx1024m -XX:ActiveProcessorCount=1" package

FROM docker.io/library/eclipse-temurin:25-jre AS runtime
WORKDIR /work
# Ensure wget is available for the healthcheck
RUN set -eux; \
	apt-get update; \
	apt-get install -y --no-install-recommends wget curl unzip; \
	rm -rf /var/lib/apt/lists/*;
# Pin the agent at a Java 25-compatible release and keep the download explicit.
ARG NEW_RELIC_AGENT_VERSION=9.3.0
ENV NEW_RELIC_HOME=/opt/newrelic \
	NEW_RELIC_CONFIG_FILE=/opt/newrelic/newrelic.yml \
	NEW_RELIC_AGENT_ENABLED=false
RUN set -eux; \
	mkdir -p /opt/newrelic; \
	wget -qO /tmp/newrelic-java.zip "https://download.newrelic.com/newrelic/java-agent/newrelic-agent/${NEW_RELIC_AGENT_VERSION}/newrelic-java.zip"; \
	unzip -q /tmp/newrelic-java.zip -d /opt; \
	rm -f /tmp/newrelic-java.zip;
# Copy the full Quarkus application layout so that quarkus-run.jar can load classes from lib/
COPY --from=build /workspace/target/quarkus-app/ /work/
COPY ops/newrelic/newrelic.yml /opt/newrelic/newrelic.yml
COPY ops/newrelic/extensions/ /opt/newrelic/extensions/

EXPOSE 8080
USER 65534:65534
# Run the Quarkus runner jar from the quarkus-app directory
CMD ["/bin/sh", "-ec", "if [ \"${NEW_RELIC_AGENT_ENABLED:-false}\" = \"true\" ]; then exec java -Dnewrelic.config.file=${NEW_RELIC_CONFIG_FILE} -Dnewrelic.config.license_key=\"${NEW_RELIC_LICENSE_KEY:-}\" -Dnewrelic.config.app_name=\"${NEW_RELIC_APP_NAME:-habittracker-api}\" -Dnewrelic.environment=${DEPLOYMENT_ENV:-development} -Dnewrelic.config.application_logging.forwarding.enabled=${NEW_RELIC_APPLICATION_LOGGING_FORWARDING_ENABLED:-false} -Dnewrelic.config.application_logging.forwarding.max_samples_stored=${NEW_RELIC_APPLICATION_LOGGING_FORWARDING_MAX_SAMPLES_STORED:-10000} -Dnewrelic.config.application_logging.local_decorating.enabled=${NEW_RELIC_APPLICATION_LOGGING_LOCAL_DECORATING_ENABLED:-false} -javaagent:${NEW_RELIC_HOME}/newrelic.jar -jar /work/quarkus-run.jar; fi; exec java -jar /work/quarkus-run.jar"]
