# REST API Fundamentals

REST (Representational State Transfer) is an architectural style for designing networked applications. It uses HTTP methods to perform CRUD operations on resources.

## HTTP Methods

- **GET** – Retrieves data from a server
- **POST** – Creates a new resource
- **PUT** – Updates an existing resource
- **DELETE** – Removes a resource

## Key Principles

- **Stateless**: Every request must contain all necessary information. The server stores no session state.
- **Resource-based**: Everything is treated as a resource identified by a URL.
- **JSON Format**: Most REST APIs use JSON to send and receive data.

## HTTP Status Codes

- 200 OK – Request was successful
- 201 Created – A new resource was created
- 400 Bad Request – Client sent invalid data
- 401 Unauthorized – Authentication is required
- 404 Not Found – Resource does not exist
- 500 Internal Server Error – Server-side failure