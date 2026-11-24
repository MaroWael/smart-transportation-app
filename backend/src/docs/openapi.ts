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
    { name: "metro", description: "Cairo Metro lines and stations" },
    { name: "stations", description: "Stations directory and search" },
    { name: "bus", description: "Cairo Bus routes and stops" },
    { name: "journeys", description: "Journey planning and automated fare calculation (Metro & Bus)" },
    { name: "bookings", description: "Ticket bookings, Stripe Test Mode checkout, QR tickets & booking history" },
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
    "/api/metro/lines": {
      get: {
        tags: ["metro"],
        summary: "List all metro lines",
        description: "Returns all metro lines ordered by line number, including station counts.",
        operationId: "getMetroLines",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "List of metro lines",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/MetroLinesResponse",
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
        },
      },
    },
    "/api/metro/lines/{id}": {
      get: {
        tags: ["metro"],
        summary: "Get metro line details",
        description: "Returns a single metro line with ordered stations and interchange details.",
        operationId: "getMetroLineById",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Metro line UUID",
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": {
            description: "Metro line details with stations",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/MetroLineDetailResponse",
                },
              },
            },
          },
          "400": {
            description: "Invalid UUID parameter",
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
          "404": {
            description: "Metro line not found",
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
    "/api/stations": {
      get: {
        tags: ["stations"],
        summary: "List or search stations",
        description: "Returns all stations with lines summary. Supports search by query string (q) and line filter (lineId).",
        operationId: "getStations",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "q",
            in: "query",
            required: false,
            description: "Case-insensitive station name search query",
            schema: { type: "string" },
          },
          {
            name: "lineId",
            in: "query",
            required: false,
            description: "Filter stations by metro line UUID",
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": {
            description: "List of stations",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/StationsResponse",
                },
              },
            },
          },
          "400": {
            description: "Invalid query parameters",
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
        },
      },
    },
    "/api/bus/routes": {
      get: {
        tags: ["bus"],
        summary: "List all bus routes",
        description: "Returns all bus routes ordered by code, including stop counts.",
        operationId: "getBusRoutes",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "List of bus routes",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/BusRoutesResponse",
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
        },
      },
    },
    "/api/bus/routes/{id}": {
      get: {
        tags: ["bus"],
        summary: "Get bus route details",
        description: "Returns a single bus route with ordered stops.",
        operationId: "getBusRouteById",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Bus route UUID",
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": {
            description: "Bus route details with stops",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/BusRouteDetailResponse",
                },
              },
            },
          },
          "400": {
            description: "Invalid UUID parameter",
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
          "404": {
            description: "Bus route not found",
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
    "/api/journeys/calculate": {
      post: {
        tags: ["journeys"],
        summary: "Calculate Metro or Bus journey route and fare",
        description:
          "Computes the shortest route, station/stop count, transfers, estimated duration, and matching fare rule for a Metro or Bus journey. Rejects identical or invalid selections.",
        operationId: "calculateJourney",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                oneOf: [
                  { $ref: "#/components/schemas/CalculateMetroJourneyRequest" },
                  { $ref: "#/components/schemas/CalculateBusJourneyRequest" },
                ],
              },
              example: {
                transportType: "METRO",
                originStationId: "11111111-1111-1111-1111-111111111111",
                destinationStationId: "22222222-2222-2222-2222-222222222222",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Calculated journey route and ticket fare",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/JourneyCalculationResponse",
                },
              },
            },
          },
          "400": {
            description: "Invalid input or identical origin and destination",
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
          "404": {
            description: "Station, bus route, or fare rule not found",
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
    "/api/journeys/fare-rules": {
      get: {
        tags: ["journeys"],
        summary: "List active Metro & Bus fare rules",
        description: "Returns configured fare tiers, optionally filtered by transportType (METRO or BUS).",
        operationId: "getFareRules",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "transportType",
            in: "query",
            required: false,
            description: "Filter fare rules by transport mode",
            schema: { type: "string", enum: ["METRO", "BUS"] },
          },
        ],
        responses: {
          "200": {
            description: "List of active fare rules",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/FareRulesResponse",
                },
              },
            },
          },
          "400": {
            description: "Invalid transportType query parameter",
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
        },
      },
    },
    "/api/bookings": {
      post: {
        tags: ["bookings"],
        summary: "Create a ticket booking (Metro or Bus)",
        description:
          "Validates the selected journey, calculates the authoritative fare, stores a PENDING booking, and creates a Stripe Test Mode PaymentIntent.",
        operationId: "createBooking",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                oneOf: [
                  { $ref: "#/components/schemas/CalculateMetroJourneyRequest" },
                  { $ref: "#/components/schemas/CalculateBusJourneyRequest" },
                ],
              },
            },
          },
        },
        responses: {
          "201": { description: "Booking created with Stripe Test Mode PaymentIntent" },
          "400": { description: "Invalid booking request" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/api/bookings/me": {
      get: {
        tags: ["bookings"],
        summary: "List current passenger's bookings and tickets",
        description: "Returns all current and previous bookings belonging strictly to the authenticated passenger.",
        operationId: "listMyBookings",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "List of passenger bookings" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/api/bookings/{id}": {
      get: {
        tags: ["bookings"],
        summary: "Get booking and QR ticket details",
        description: "Returns a single booking with payment status and signed QR ticket image (owner only).",
        operationId: "getBookingById",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": { description: "Booking detail with QR ticket if confirmed" },
          "403": { description: "Forbidden (belongs to another passenger)" },
          "404": { description: "Booking not found" },
        },
      },
    },
    "/api/bookings/{id}/confirm-payment": {
      post: {
        tags: ["bookings"],
        summary: "Confirm Stripe Test Mode payment outcome",
        description:
          "Processes a Stripe Test Mode outcome (SUCCEEDED, FAILED, or CANCELLED). Issues a unique signed QR ticket only when outcome is SUCCEEDED.",
        operationId: "confirmBookingPayment",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  outcome: {
                    type: "string",
                    enum: ["SUCCEEDED", "FAILED", "CANCELLED"],
                    default: "SUCCEEDED",
                  },
                },
              },
              example: { outcome: "SUCCEEDED" },
            },
          },
        },
        responses: {
          "200": { description: "Updated booking with QR ticket on SUCCEEDED" },
          "400": { description: "Invalid outcome or booking already finalized" },
          "403": { description: "Forbidden" },
          "404": { description: "Booking not found" },
        },
      },
    },
    "/api/tickets/validate": {
      post: {
        tags: ["Tickets"],
        summary: "Validate a passenger QR ticket or manual ticket code (Station Staff / Admin)",
        description:
          "Verifies the HMAC-SHA256 QR signature (or looks up by ticketCode), marks valid ACTIVE tickets as USED to prevent reuse, and logs every validation attempt.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  qrPayload: { type: "string", example: "ST1.ST-A1B2C3D4.12345678.abcdef0123456789" },
                  ticketCode: { type: "string", example: "ST-A1B2C3D4" },
                  stationName: { type: "string", example: "Sadat" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Validation outcome (VALID, ALREADY_USED, EXPIRED, INVALID)" },
          "400": { description: "Missing qrPayload and ticketCode" },
          "401": { description: "Unauthorized" },
          "403": { description: "Forbidden (requires STATION_EMPLOYEE or ADMIN role)" },
        },
      },
    },
    "/api/tickets/validations": {
      get: {
        tags: ["Tickets"],
        summary: "List recent ticket validations (Station Staff / Admin)",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Recent ticket validation log entries" },
          "401": { description: "Unauthorized" },
          "403": { description: "Forbidden (requires STATION_EMPLOYEE or ADMIN role)" },
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
      StationLineSummary: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          number: { type: "integer", example: 1 },
          color: { type: "string", example: "#D32F2F" },
        },
        required: ["id", "number", "color"],
      },
      MetroLine: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          number: { type: "integer", example: 1 },
          nameEn: { type: "string", example: "Line 1 (Helwan - New El-Marg)" },
          color: { type: "string", example: "#D32F2F" },
          stationCount: { type: "integer", example: 35 },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: ["id", "number", "nameEn", "color", "stationCount", "createdAt", "updatedAt"],
      },
      MetroLineStationItem: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          nameEn: { type: "string", example: "Sadat" },
          lat: { type: "number", example: 30.0444 },
          lng: { type: "number", example: 31.2357 },
          order: { type: "integer", example: 19 },
          branch: { type: "string", nullable: true, example: "Cairo University Branch" },
          lines: {
            type: "array",
            items: { $ref: "#/components/schemas/StationLineSummary" },
          },
          isInterchange: { type: "boolean", example: true },
        },
        required: ["id", "nameEn", "lat", "lng", "order", "lines", "isInterchange"],
      },
      MetroLineDetail: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          number: { type: "integer", example: 3 },
          nameEn: { type: "string", example: "Line 3 (Adly Mansour - Rod El-Farag Corridor / Cairo University)" },
          color: { type: "string", example: "#2E7D32" },
          branches: {
            type: "array",
            items: { type: "string" },
            example: ["Rod El-Farag Corridor Branch", "Cairo University Branch"],
          },
          stations: {
            type: "array",
            items: { $ref: "#/components/schemas/MetroLineStationItem" },
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: ["id", "number", "nameEn", "color", "branches", "stations", "createdAt", "updatedAt"],
      },
      MetroLinesResponse: {
        type: "object",
        properties: {
          status: { type: "string", example: "ok" },
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/MetroLine" },
          },
        },
        required: ["status", "data"],
      },
      MetroLineDetailResponse: {
        type: "object",
        properties: {
          status: { type: "string", example: "ok" },
          data: { $ref: "#/components/schemas/MetroLineDetail" },
        },
        required: ["status", "data"],
      },
      Station: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          nameEn: { type: "string", example: "Sadat" },
          lat: { type: "number", example: 30.0444 },
          lng: { type: "number", example: 31.2357 },
          lines: {
            type: "array",
            items: { $ref: "#/components/schemas/StationLineSummary" },
          },
          isInterchange: { type: "boolean", example: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: ["id", "nameEn", "lat", "lng", "lines", "isInterchange", "createdAt", "updatedAt"],
      },
      StationsResponse: {
        type: "object",
        properties: {
          status: { type: "string", example: "ok" },
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/Station" },
          },
        },
        required: ["status", "data"],
      },
      BusRoute: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          code: { type: "string", example: "BUS-101" },
          nameEn: { type: "string", example: "Tahrir - Nasr City - New Cairo" },
          stopCount: { type: "integer", example: 8 },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: ["id", "code", "nameEn", "stopCount", "createdAt", "updatedAt"],
      },
      BusStopItem: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          nameEn: { type: "string", example: "Abdel Moneim Riad Terminal" },
          lat: { type: "number", example: 30.0485 },
          lng: { type: "number", example: 31.2335 },
          order: { type: "integer", example: 1 },
        },
        required: ["id", "nameEn", "lat", "lng", "order"],
      },
      BusRouteDetail: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          code: { type: "string", example: "BUS-101" },
          nameEn: { type: "string", example: "Tahrir - Nasr City - New Cairo" },
          stops: {
            type: "array",
            items: { $ref: "#/components/schemas/BusStopItem" },
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: ["id", "code", "nameEn", "stops", "createdAt", "updatedAt"],
      },
      BusRoutesResponse: {
        type: "object",
        properties: {
          status: { type: "string", example: "ok" },
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/BusRoute" },
          },
        },
        required: ["status", "data"],
      },
      BusRouteDetailResponse: {
        type: "object",
        properties: {
          status: { type: "string", example: "ok" },
          data: { $ref: "#/components/schemas/BusRouteDetail" },
        },
        required: ["status", "data"],
      },
      CalculateMetroJourneyRequest: {
        type: "object",
        properties: {
          transportType: { type: "string", enum: ["METRO"], example: "METRO" },
          originStationId: { type: "string", format: "uuid" },
          destinationStationId: { type: "string", format: "uuid" },
        },
        required: ["transportType", "originStationId", "destinationStationId"],
      },
      CalculateBusJourneyRequest: {
        type: "object",
        properties: {
          transportType: { type: "string", enum: ["BUS"], example: "BUS" },
          busRouteId: { type: "string", format: "uuid" },
          originStopId: { type: "string", format: "uuid" },
          destinationStopId: { type: "string", format: "uuid" },
        },
        required: ["transportType", "busRouteId", "originStopId", "destinationStopId"],
      },
      FareRule: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          transportType: { type: "string", enum: ["METRO", "BUS"] },
          minStops: { type: "integer", example: 1 },
          maxStops: { type: "integer", example: 9 },
          price: { type: "number", example: 8 },
          currency: { type: "string", example: "EGP" },
          isActive: { type: "boolean", example: true },
        },
        required: ["id", "transportType", "minStops", "maxStops", "price", "currency", "isActive"],
      },
      FareRulesResponse: {
        type: "object",
        properties: {
          status: { type: "string", example: "ok" },
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/FareRule" },
          },
        },
        required: ["status", "data"],
      },
      JourneyCalculationResponse: {
        type: "object",
        properties: {
          status: { type: "string", example: "ok" },
          data: {
            type: "object",
            properties: {
              transportType: { type: "string", enum: ["METRO", "BUS"] },
              origin: {
                type: "object",
                properties: {
                  id: { type: "string", format: "uuid" },
                  nameEn: { type: "string" },
                },
              },
              destination: {
                type: "object",
                properties: {
                  id: { type: "string", format: "uuid" },
                  nameEn: { type: "string" },
                },
              },
              stopCount: { type: "integer", example: 6 },
              estimatedMinutes: { type: "integer", example: 13 },
              fare: {
                type: "object",
                properties: {
                  fareRuleId: { type: "string", format: "uuid" },
                  amount: { type: "number", example: 8 },
                  currency: { type: "string", example: "EGP" },
                  minStops: { type: "integer", example: 1 },
                  maxStops: { type: "integer", example: 9 },
                },
              },
              transfers: {
                type: "array",
                items: { type: "object" },
              },
              path: {
                type: "array",
                items: { type: "object" },
              },
            },
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
