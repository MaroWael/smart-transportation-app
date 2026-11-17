// ---------------------------------------------------------------
// Smart Transportation — OpenAPI 3.0 specification
// ---------------------------------------------------------------
// Hand-written OpenAPI document describing the /api/* surface.
// Servers: [{ url: "/" }] so it works on localhost and Vercel.
// ---------------------------------------------------------------

export const openapi = {
  openapi: "3.0.3",
  info: {
    title: "Smart Transportation API",
    version: "1.0.0",
    description: "Backend API for the Smart Transportation Expo app.",
  },
  servers: [{ url: "/" }],
  tags: [
    { name: "health", description: "Application health check" },
    { name: "auth", description: "Authentication (stateless JWT)" },
  ],
  paths: {
    "/api/health": {
      get: {
        tags: ["health"],
        summary: "Health check",
        description: "Reports application status and database connectivity.",
        operationId: "getHealth",
        responses: {
          "200": {
            description: "Service is healthy",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/HealthResponse",
                },
              },
            },
          },
          "503": {
            description: "Service is degraded",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/HealthResponse",
                },
              },
            },
          },
        },
      },
    },
    "/api/auth/register": {
      post: {
        tags: ["auth"],
        summary: "Register a new passenger",
        description:
          "Creates a new passenger account. Role is always PASSENGER; any role sent is ignored. Email is normalized (trimmed + lowercased).",
        operationId: "register",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/RegisterRequest",
              },
              example: {
                fullName: "John Doe",
                email: "john.doe@example.com",
                password: "StrongPass123!",
              },
            },
          },
        },
        responses: {
          "201": {
            description: "User registered successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/AuthResponse",
                },
              },
            },
          },
          "400": {
            description: "Invalid input",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          "409": {
            description: "Email already registered",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["auth"],
        summary: "Log in",
        description: "Authenticates with email and password. Returns a JWT access token.",
        operationId: "login",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/LoginRequest",
              },
              example: {
                email: "john.doe@example.com",
                password: "StrongPass123!",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Login successful",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/AuthResponse",
                },
              },
            },
          },
          "400": {
            description: "Invalid input",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          "401": {
            description: "Invalid email or password",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          "403": {
            description: "Account is inactive",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["auth"],
        summary: "Get current user",
        description: "Returns the authenticated user's profile (no passwordHash).",
        operationId: "getMe",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "User profile",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/MeResponse",
                },
              },
            },
          },
          "401": {
            description: "Unauthorized (missing or invalid token)",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          "403": {
            description: "Account is inactive",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
      patch: {
        tags: ["auth"],
        summary: "Update current user",
        description: "Updates only fullName. Unknown keys (role, email, isActive) are rejected.",
        operationId: "updateMe",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/UpdateMeRequest",
              },
              example: {
                fullName: "Jane Doe",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "User profile updated",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/MeResponse",
                },
              },
            },
          },
          "400": {
            description: "Invalid input",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          "401": {
            description: "Unauthorized (missing or invalid token)",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          "403": {
            description: "Account is inactive",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "JWT access token obtained from /api/auth/login.",
      },
    },
    schemas: {
      HealthResponse: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["ok", "degraded"], example: "ok" },
          environment: { type: "string", example: "development" },
          database: {
            type: "object",
            properties: {
              connected: { type: "boolean", example: true },
              error: { type: "string", nullable: true },
            },
          },
          timestamp: { type: "string", format: "date-time" },
        },
        required: ["status", "environment", "database", "timestamp"],
      },
      RegisterRequest: {
        type: "object",
        properties: {
          fullName: { type: "string", minLength: 2, maxLength: 100, example: "John Doe" },
          email: { type: "string", format: "email", example: "john.doe@example.com" },
          password: { type: "string", minLength: 8, maxLength: 72, example: "StrongPass123!" },
        },
        required: ["fullName", "email", "password"],
      },
      LoginRequest: {
        type: "object",
        properties: {
          email: { type: "string", format: "email", example: "john.doe@example.com" },
          password: { type: "string", minLength: 1, example: "StrongPass123!" },
        },
        required: ["email", "password"],
      },
      UpdateMeRequest: {
        type: "object",
        properties: {
          fullName: { type: "string", minLength: 2, maxLength: 100, example: "Jane Doe" },
        },
        required: ["fullName"],
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string", example: "587432ef-c9d9-4aa1-af99-3f3829751f73" },
          fullName: { type: "string", example: "John Doe" },
          email: { type: "string", example: "john.doe@example.com" },
          role: { type: "string", enum: ["PASSENGER", "STATION_EMPLOYEE", "ADMIN"], example: "PASSENGER" },
          isActive: { type: "boolean", example: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: ["id", "fullName", "email", "role", "isActive", "createdAt", "updatedAt"],
      },
      AuthResponse: {
        type: "object",
        properties: {
          status: { type: "string", example: "ok" },
          data: {
            type: "object",
            properties: {
              user: { $ref: "#/components/schemas/User" },
              token: { type: "string", example: "eyJhbGci..." },
            },
            required: ["user", "token"],
          },
        },
        required: ["status", "data"],
      },
      MeResponse: {
        type: "object",
        properties: {
          status: { type: "string", example: "ok" },
          data: {
            type: "object",
            properties: {
              user: { $ref: "#/components/schemas/User" },
            },
            required: ["user"],
          },
        },
        required: ["status", "data"],
      },
      ErrorResponse: {
        type: "object",
        properties: {
          status: { type: "string", example: "error" },
          message: { type: "string", example: "Invalid input" },
          errors: {
            type: "object",
            nullable: true,
            description: "Zod field errors for 400 responses",
          },
        },
        required: ["status", "message"],
      },
    },
  },
};
