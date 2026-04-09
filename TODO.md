# Prompt: Modernization of Java/Quarkus Backend Project

---

```
You are a senior Java architect specializing in modern Quarkus applications.
Your task is to modernize a Java backend project following current best practices.

## PROJECT CONTEXT
Analyze the provided Java project and modernize it using:
- **Java 21+** (targeting Java 25 features where stable)
- **Quarkus 3.x latest stable**
- **Modern Java idioms and patterns**

---

## MODERNIZATION CHECKLIST

### 1. JAVA LANGUAGE FEATURES

**Records** — replace POJOs/DTOs:
```java
// ❌ Old
public class UserDto {
    private String name;
    private String email;
    // getters, setters, equals, hashCode, toString...
}

// ✅ Modern
public record UserDto(String name, String email) {}
```

**Sealed Classes** — for domain modeling:
```java
// ✅ Modern
public sealed interface PaymentResult
    permits PaymentResult.Success, PaymentResult.Failure, PaymentResult.Pending {
    
    record Success(String transactionId, BigDecimal amount) implements PaymentResult {}
    record Failure(String reason, ErrorCode code) implements PaymentResult {}
    record Pending(String referenceId) implements PaymentResult {}
}
```

**Pattern Matching** — switch expressions & instanceof:
```java
// ✅ Modern - Pattern matching switch
String describe(PaymentResult result) {
    return switch (result) {
        case PaymentResult.Success(var txId, var amount) -> 
            "Paid %s: %s".formatted(txId, amount);
        case PaymentResult.Failure(var reason, var code) -> 
            "Failed [%s]: %s".formatted(code, reason);
        case PaymentResult.Pending(var ref) -> 
            "Pending: %s".formatted(ref);
    };
}
```

**Text Blocks** — for SQL, JSON, templates:
```java
// ✅ Modern
String query = """
    SELECT u.id, u.name, u.email
    FROM users u
    JOIN orders o ON u.id = o.user_id
    WHERE u.status = :status
      AND o.created_at > :since
    ORDER BY u.name
    """;
```

**Virtual Threads (Project Loom)**:
```java
// ✅ In application.properties
quarkus.thread-pool.virtual-threads=true

// ✅ On blocking endpoints
@RunOnVirtualThread
@GET
@Path("/heavy")
public Response heavyOperation() { ... }
```

**SequencedCollections** (Java 21+):
```java
// ✅ Modern
List<String> items = new ArrayList<>();
String first = items.getFirst();
String last  = items.getLast();
items.addFirst("new-first");
```

---

### 2. QUARKUS SPECIFIC MODERNIZATION

**Reactive REST with RESTEasy Reactive**:
```java
// ❌ Old — JAX-RS blocking
@Path("/users")
public class UserResource {
    @GET
    public List<User> getAll() { ... }
}

// ✅ Modern — Reactive
@Path("/users")
public class UserResource {
    
    @Inject
    UserService userService;
    
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Multi<UserDto> getAll() {
        return userService.streamAll();
    }
    
    @GET
    @Path("/{id}")
    public Uni<Response> getById(@PathParam("id") Long id) {
        return userService.findById(id)
            .map(user -> Response.ok(user).build())
            .onItem().ifNull()
            .continueWith(Response.status(404).build());
    }
}
```

**Panache Active Record or Repository**:
```java
// ✅ Modern — Panache Repository with Reactive
@ApplicationScoped
public class UserRepository implements PanacheRepository<User> {
    
    public Uni<List<User>> findActiveUsers() {
        return find("status = ?1 ORDER BY createdAt DESC", UserStatus.ACTIVE)
            .list();
    }
    
    public Uni<Long> countByEmail(String email) {
        return count("email", email);
    }
}

// ✅ Or Panache Entity (Active Record)
@Entity
public class User extends PanacheEntity {
    public String name;
    public String email;
    
    @Column(name = "created_at")
    public Instant createdAt;
    
    public static Uni<List<User>> findActive() {
        return find("status", UserStatus.ACTIVE).list();
    }
}
```

**Dependency Injection — CDI best practices**:
```java
// ❌ Old
@Inject
UserRepository userRepository;  // field injection

// ✅ Modern — constructor injection
@ApplicationScoped
public class UserService {
    
    private final UserRepository repository;
    private final EventBus eventBus;
    
    @Inject  // optional if single constructor
    public UserService(UserRepository repository, EventBus eventBus) {
        this.repository = repository;
        this.eventBus = eventBus;
    }
}
```

**Configuration with @ConfigMapping**:
```java
// ❌ Old
@ConfigProperty(name = "app.payment.url")
String paymentUrl;

// ✅ Modern — typed config interface
@ConfigMapping(prefix = "app")
public interface AppConfig {
    
    PaymentConfig payment();
    SecurityConfig security();
    
    interface PaymentConfig {
        @WithDefault("https://api.payment.com")
        String url();
        Duration timeout();
        int maxRetries();
    }
    
    interface SecurityConfig {
        String jwtSecret();
        Duration tokenExpiry();
    }
}
```

**Exception Mapping**:
```java
// ✅ Modern — centralized error handling
@Provider
public class GlobalExceptionMapper implements ExceptionMapper<Exception> {
    
    private static final Logger log = Logger.getLogger(GlobalExceptionMapper.class);
    
    @Override
    public Response toResponse(Exception exception) {
        return switch (exception) {
            case NotFoundException e -> 
                errorResponse(404, e.getMessage());
            case ValidationException e -> 
                errorResponse(422, e.getMessage());
            case UnauthorizedException e -> 
                errorResponse(401, "Unauthorized");
            default -> {
                log.errorf(exception, "Unexpected error");
                yield errorResponse(500, "Internal Server Error");
            }
        };
    }
    
    private Response errorResponse(int status, String message) {
        var error = new ErrorDto(status, message, Instant.now());
        return Response.status(status).entity(error).build();
    }
}

public record ErrorDto(int status, String message, Instant timestamp) {}
```

---

### 3. REACTIVE PATTERNS

**Mutiny chains**:
```java
// ✅ Modern reactive pipeline
public Uni<OrderDto> createOrder(CreateOrderRequest request) {
    return userRepository.findById(request.userId())
        .onItem().ifNull().failWith(() -> 
            new NotFoundException("User not found: " + request.userId()))
        .flatMap(user -> validateInventory(request.items())
            .map(validated -> buildOrder(user, validated)))
        .flatMap(orderRepository::persist)
        .invoke(order -> eventBus.publish("order.created", order.id()))
        .map(orderMapper::toDto);
}
```

**Event Bus**:
```java
// ✅ Async events
@ApplicationScoped
public class OrderEventHandler {
    
    @ConsumeEvent("order.created")
    public Uni<Void> onOrderCreated(Long orderId) {
        return notificationService.sendConfirmation(orderId)
            .chain(() -> analyticsService.trackOrder(orderId));
    }
}
```

---

### 4. OBSERVABILITY

**Structured Logging**:
```java
// ✅ Modern — structured with context
@ApplicationScoped
public class UserService {
    
    private static final Logger log = Logger.getLogger(UserService.class);
    
    public Uni<User> createUser(CreateUserRequest request) {
        log.infof("Creating user: email=%s", request.email());
        
        return userRepository.persist(new User(request))
            .invoke(user -> log.infof(
                "User created: id=%d, email=%s", user.id, user.email))
            .onFailure().invoke(ex -> 
                log.errorf(ex, "Failed to create user: email=%s", request.email()));
    }
}
```

**Metrics with Micrometer**:
```java
// ✅ Custom metrics
@ApplicationScoped
public class PaymentService {
    
    private final MeterRegistry registry;
    private final Counter paymentCounter;
    
    public PaymentService(MeterRegistry registry) {
        this.registry = registry;
        this.paymentCounter = Counter.builder("payments.processed")
            .tag("service", "payment")
            .register(registry);
    }
    
    public Uni<PaymentResult> process(Payment payment) {
        return doProcess(payment)
            .invoke(result -> {
                paymentCounter.increment();
                registry.timer("payments.duration")
                    .record(payment.processingTime());
            });
    }
}
```

**OpenTelemetry Tracing**:
```java
// ✅ Custom spans
@ApplicationScoped
public class UserService {
    
    @WithSpan("UserService.findById")
    public Uni<User> findById(@SpanAttribute("user.id") Long id) {
        return userRepository.findById(id);
    }
}
```

---

### 5. SECURITY

**JWT + RBAC**:
```java
// ✅ Modern security
@Path("/admin/users")
@RolesAllowed("admin")
@Authenticated
public class AdminUserResource {
    
    @Inject
    JsonWebToken jwt;
    
    @GET
    public Uni<List<UserDto>> getAll() {
        String requestedBy = jwt.getSubject();
        log.infof("Admin list requested by: %s", requestedBy);
        return userService.findAll();
    }
    
    @DELETE
    @Path("/{id}")
    @RolesAllowed({"admin", "superadmin"})
    public Uni<Response> delete(@PathParam("id") Long id) {
        return userService.delete(id)
            .map(v -> Response.noContent().build());
    }
}
```

---

### 6. TESTING

**QuarkusTest modern approach**:
```java
// ✅ Modern testing
@QuarkusTest
class UserResourceTest {
    
    @InjectMock
    UserService userService;
    
    @Test
    void shouldCreateUser() {
        var request = new CreateUserRequest("John", "john@example.com");
        var expected = new UserDto(1L, "John", "john@example.com");
        
        when(userService.create(request)).thenReturn(Uni.createFrom().item(expected));
        
        given()
            .contentType(ContentType.JSON)
            .body(request)
        .when()
            .post("/users")
        .then()
            .statusCode(201)
            .body("name", equalTo("John"))
            .body("email", equalTo("john@example.com"));
    }
}

// ✅ Integration test with Testcontainers
@QuarkusTest
@QuarkusTestResource(PostgresTestResource.class)
class UserRepositoryIT {
    
    @Inject
    UserRepository repository;
    
    @Test
    @TestTransaction
    void shouldFindActiveUsers() {
        var users = repository.findActiveUsers()
            .await().atMost(Duration.ofSeconds(5));
        
        assertThat(users).isNotEmpty()
            .allMatch(u -> u.status == UserStatus.ACTIVE);
    }
}
```

---

### 7. PERFORMANCE & BUILD

**application.properties — production ready**:
```properties
# HTTP
quarkus.http.port=8080
quarkus.http.cors=true
quarkus.http.cors.origins=https://yourapp.com

# Virtual Threads
quarkus.thread-pool.virtual-threads=true

# Database — Reactive
quarkus.datasource.db-kind=postgresql
quarkus.datasource.reactive.url=vertx-reactive:postgresql://localhost/mydb
quarkus.datasource.reactive.max-size=20
quarkus.hibernate-orm.database.generation=none

# Flyway migrations
quarkus.flyway.migrate-at-start=true
quarkus.flyway.locations=classpath:db/migration

# Cache
quarkus.cache.caffeine."user-cache".maximum-size=1000
quarkus.cache.caffeine."user-cache".expire-after-write=10M

# Health
quarkus.smallrye-health.ui.always-include=true

# OpenAPI
quarkus.smallrye-openapi.info-title=My API
quarkus.smallrye-openapi.info-version=1.0.0

# Logging
quarkus.log.level=INFO
quarkus.log.category."com.myapp".level=DEBUG
quarkus.log.console.json=true

# Native build optimization
quarkus.native.additional-build-args=-H:+ReportExceptionStackTraces
```

**pom.xml — modern dependencies**:
```xml
<properties>
    <java.version>21</java.version>
    <quarkus.platform.version>3.15.x</quarkus.platform.version>
    <compiler-plugin.version>3.13.0</compiler-plugin.version>
</properties>

<!-- Key extensions -->
<dependencies>
    <!-- Core reactive REST -->
    <dependency>
        <groupId>io.quarkus</groupId>
        <artifactId>quarkus-resteasy-reactive-jackson</artifactId>
    </dependency>
    <!-- Reactive Panache -->
    <dependency>
        <groupId>io.quarkus</groupId>
        <artifactId>quarkus-hibernate-reactive-panache</artifactId>
    </dependency>
    <!-- Reactive PgSQL -->
    <dependency>
        <groupId>io.quarkus</groupId>
        <artifactId>quarkus-reactive-pg-client</artifactId>
    </dependency>
    <!-- Security -->
    <dependency>
        <groupId>io.quarkus</groupId>
        <artifactId>quarkus-smallrye-jwt</artifactId>
    </dependency>
    <!-- Observability -->
    <dependency>
        <groupId>io.quarkus</groupId>
        <artifactId>quarkus-micrometer-registry-prometheus</artifactId>
    </dependency>
    <dependency>
        <groupId>io.quarkus</groupId>
        <artifactId>quarkus-opentelemetry</artifactId>
    </dependency>
    <!-- Cache -->
    <dependency>
        <groupId>io.quarkus</groupId>
        <artifactId>quarkus-cache</artifactId>
    </dependency>
    <!-- Validation -->
    <dependency>
        <groupId>io.quarkus</groupId>
        <artifactId>quarkus-hibernate-validator</artifactId>
    </dependency>
    <!-- Flyway -->
    <dependency>
        <groupId>io.quarkus</groupId>
        <artifactId>quarkus-flyway</artifactId>
    </dependency>
    <!-- Health -->
    <dependency>
        <groupId>io.quarkus</groupId>
        <artifactId>quarkus-smallrye-health</artifactId>
    </dependency>
    <!-- OpenAPI -->
    <dependency>
        <groupId>io.quarkus</groupId>
        <artifactId>quarkus-smallrye-openapi</artifactId>
    </dependency>
    <!-- Testing -->
    <dependency>
        <groupId>io.quarkus</groupId>
        <artifactId>quarkus-junit5</artifactId>
        <scope>test</scope>
    </dependency>
    <dependency>
        <groupId>io.quarkus</groupId>
        <artifactId>quarkus-test-security</artifactId>
        <scope>test</scope>
    </dependency>
</dependencies>
```

---

## INSTRUCTIONS FOR AI

When modernizing this project:

1. **ANALYZE** — scan all classes, identify outdated patterns
2. **PRIORITIZE** — list changes by impact (High/Medium/Low)
3. **MIGRATE** step by step:
   - Classes → Records where applicable
   - Switch statements → Pattern matching switch
   - Blocking REST → Reactive (Uni/Multi)
   - Field injection → Constructor injection
   - @ConfigProperty → @ConfigMapping
   - Raw exceptions → Sealed result types
4. **PRESERVE** — business logic, do not change behavior
5. **EXPLAIN** — for each change, state WHY it's better
6. **TEST** — update/add tests for changed code
7. **VALIDATE** — ensure native compilation compatibility

### Output format per file:
```
## [FileName.java]
**Issues found:** ...
**Changes applied:** ...
**Before:** [old code]
**After:** [new code]  
**Reason:** [why this is better]
```

### Priority order:
1. 🔴 Security vulnerabilities
2. 🟠 Blocking code in reactive context
3. 🟡 Missing error handling
4. 🟢 Language modernization (records, pattern matching)
5. 🔵 Performance (caching, virtual threads)
6. ⚪ Code style & readability
```

---

**Paste your project files below and I will modernize them systematically.**
```