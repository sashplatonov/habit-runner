# JVM build for local development
FROM docker.io/library/eclipse-temurin:25-jdk AS build
WORKDIR /workspace

# Copy only the app sources (context will be apps/backend)
COPY .mvn .mvn
COPY --chmod=0755 mvnw mvnw
COPY pom.xml .
COPY checkstyle checkstyle
COPY src src

RUN ./mvnw -B package

# Normalize produced jar to a known location. Prefer the Quarkus run jar if present.
RUN set -eux; \
		if [ -f target/quarkus-app/quarkus-run.jar ]; then \
			cp target/quarkus-app/quarkus-run.jar application.jar; \
		else \
			JAR=$(ls target/*.jar | grep -v "original" | head -n1) && cp "$JAR" application.jar; \
		fi

FROM docker.io/library/eclipse-temurin:25-jre AS runtime
WORKDIR /work
# Ensure wget is available for the healthcheck
RUN set -eux; \
	apt-get update; \
	apt-get install -y --no-install-recommends wget curl unzip; \
	rm -rf /var/lib/apt/lists/*;
# Pin the agent at a Java 25-compatible release and keep the download explicit.
ARG NEW_RELIC_AGENT_VERSION=9.2.0
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

EXPOSE 8080
# Run the Quarkus runner jar from the quarkus-app directory
CMD ["/bin/sh", "-ec", "if [ \"${NEW_RELIC_AGENT_ENABLED:-false}\" = \"true\" ]; then exec java -Dnewrelic.config.file=${NEW_RELIC_CONFIG_FILE} -Dnewrelic.config.license_key=\"${NEW_RELIC_LICENSE_KEY:-}\" -Dnewrelic.config.app_name=\"${NEW_RELIC_APP_NAME:-habittracker-api}\" -Dnewrelic.environment=${DEPLOYMENT_ENV:-development} -Dnewrelic.config.application_logging.forwarding.enabled=${NEW_RELIC_APPLICATION_LOGGING_FORWARDING_ENABLED:-false} -Dnewrelic.config.application_logging.forwarding.max_samples_stored=${NEW_RELIC_APPLICATION_LOGGING_FORWARDING_MAX_SAMPLES_STORED:-10000} -Dnewrelic.config.application_logging.local_decorating.enabled=${NEW_RELIC_APPLICATION_LOGGING_LOCAL_DECORATING_ENABLED:-false} -javaagent:${NEW_RELIC_HOME}/newrelic.jar -jar /work/quarkus-run.jar; fi; exec java -jar /work/quarkus-run.jar"]
