################
##### Builder
FROM rust:alpine3.16 as builder

WORKDIR /app

RUN apk add --no-cache musl-dev
RUN apk add --no-cache libssl-dev

# Create blank project
RUN USER=root cargo new app-service

# We want dependencies cached, so copy those first.
COPY Cargo.toml Cargo.lock /app/app-service/

# Set the working directory
WORKDIR /app/app-service

## Install target platform (Cross-Compilation) --> Needed for Alpine
RUN rustup target add x86_64-unknown-linux-musl

# This is a dummy build to get the dependencies cached.
RUN cargo build --target x86_64-unknown-linux-musl --release

# Now copy in the rest of the sources
COPY src /app/app-service/src/

## Touch main.rs to prevent cached release build
RUN touch /app/app-service/src/main.rs

# This is the actual application build.
RUN cargo build --target x86_64-unknown-linux-musl --release

################
##### Runtime
FROM alpine:3.16.0 AS runtime

RUN apk add musl-dev openssl-dev
# RUN apk add --no-cache musl-dev
# RUN apk add --no-cache openssl-dev

# Copy application binary from builder image
COPY --from=builder /app/app-service/target/x86_64-unknown-linux-musl/release/app-service /usr/local/bin

EXPOSE 8080

# Run the application
CMD ["/usr/local/bin/app-service"]