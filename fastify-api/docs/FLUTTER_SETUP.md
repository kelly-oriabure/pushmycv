# Flutter Mobile App Setup Guide

## Project Structure (Clean Architecture + Riverpod)

This guide provides the complete setup for the PushMyCV Flutter mobile app using Clean Architecture and Riverpod for state management.

## Initial Setup

### 1. Create Flutter Project

```bash
cd c:/Users/firmcloud/Documents/projects
flutter create pushmycv_mobile --org com.pushmycv
cd pushmycv_mobile
```

### 2. Update pubspec.yaml

```yaml
name: pushmycv_mobile
description: PushMyCV mobile application for job seekers
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  
  # State Management
  flutter_riverpod: ^2.4.9
  riverpod_annotation: ^2.3.3
  
  # Networking
  dio: ^5.4.0
  retrofit: ^4.0.3
  pretty_dio_logger: ^1.3.1
  
  # Local Storage
  shared_preferences: ^2.2.2
  flutter_secure_storage: ^9.0.0
  hive: ^2.2.3
  hive_flutter: ^1.1.0
  
  # Functional Programming
  dartz: ^0.10.1
  
  # Dependency Injection
  get_it: ^7.6.4
  injectable: ^2.3.2
  
  # Navigation
  go_router: ^13.0.0
  
  # UI Components
  flutter_svg: ^2.0.9
  cached_network_image: ^3.3.0
  shimmer: ^3.0.0
  flutter_spinkit: ^5.2.0
  
  # Forms & Validation
  flutter_form_builder: ^9.1.1
  form_builder_validators: ^9.1.0
  
  # Utils
  equatable: ^2.0.5
  intl: ^0.18.1
  logger: ^2.0.2
  freezed_annotation: ^2.4.1
  json_annotation: ^4.8.1
  
  # File Handling
  file_picker: ^6.1.1
  image_picker: ^1.0.7
  path_provider: ^2.1.2
  
  # Permissions
  permission_handler: ^11.2.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  
  # Code Generation
  build_runner: ^2.4.7
  riverpod_generator: ^2.3.9
  riverpod_lint: ^2.3.7
  retrofit_generator: ^8.0.6
  injectable_generator: ^2.4.1
  freezed: ^2.4.6
  json_serializable: ^6.7.1
  hive_generator: ^2.0.1
  
  # Testing
  mockito: ^5.4.4
  mocktail: ^1.0.3
  
  # Linting
  flutter_lints: ^3.0.1
  very_good_analysis: ^5.1.0

flutter:
  uses-material-design: true
  
  assets:
    - assets/images/
    - assets/icons/
    - assets/fonts/
  
  fonts:
    - family: Inter
      fonts:
        - asset: assets/fonts/Inter-Regular.ttf
        - asset: assets/fonts/Inter-Medium.ttf
          weight: 500
        - asset: assets/fonts/Inter-SemiBold.ttf
          weight: 600
        - asset: assets/fonts/Inter-Bold.ttf
          weight: 700
```

### 3. Install Dependencies

```bash
flutter pub get
```

## Clean Architecture Structure

### Create Directory Structure

```bash
# Core
mkdir -p lib/core/{constants,errors,network,usecases,utils,theme}

# Features
mkdir -p lib/features/auth/{data/{datasources,models,repositories},domain/{entities,repositories,usecases},presentation/{providers,pages,widgets}}
mkdir -p lib/features/profile/{data/{datasources,models,repositories},domain/{entities,repositories,usecases},presentation/{providers,pages,widgets}}
mkdir -p lib/features/resume/{data/{datasources,models,repositories},domain/{entities,repositories,usecases},presentation/{providers,pages,widgets}}
mkdir -p lib/features/jobs/{data/{datasources,models,repositories},domain/{entities,repositories,usecases},presentation/{providers,pages,widgets}}
mkdir -p lib/features/applications/{data/{datasources,models,repositories},domain/{entities,repositories,usecases},presentation/{providers,pages,widgets}}

# Shared
mkdir -p lib/shared/{widgets,providers,utils}

# Config
mkdir -p lib/config
```

## Core Files

### 1. API Constants

**`lib/core/constants/api_constants.dart`**

```dart
class ApiConstants {
  static const String baseUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'http://localhost:3000',
  );
  
  // Auth endpoints
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String otpRequest = '/auth/otp/request-otp';
  static const String otpVerify = '/auth/otp/verify-otp';
  static const String otpComplete = '/auth/otp/complete-registration';
  
  // Profile endpoints
  static const String profiles = '/api/profiles';
  static String profileById(String id) => '/api/profiles/$id';
  
  // Resume endpoints
  static const String resumes = '/api/resumes';
  static String resumeById(String id) => '/api/resumes/$id';
  
  // Jobs endpoints
  static const String jobs = '/api/jobs';
  static String jobById(String id) => '/api/jobs/$id';
  
  // Applications endpoints
  static const String applications = '/api/applications';
  static String applicationById(String id) => '/api/applications/$id';
}
```

### 2. Failures & Exceptions

**`lib/core/errors/failures.dart`**

```dart
import 'package:equatable/equatable.dart';

abstract class Failure extends Equatable {
  final String message;
  
  const Failure(this.message);
  
  @override
  List<Object> get props => [message];
}

class ServerFailure extends Failure {
  const ServerFailure(super.message);
}

class CacheFailure extends Failure {
  const CacheFailure(super.message);
}

class NetworkFailure extends Failure {
  const NetworkFailure(super.message);
}

class ValidationFailure extends Failure {
  const ValidationFailure(super.message);
}

class AuthenticationFailure extends Failure {
  const AuthenticationFailure(super.message);
}
```

**`lib/core/errors/exceptions.dart`**

```dart
class ServerException implements Exception {
  final String message;
  final int? statusCode;
  
  ServerException(this.message, [this.statusCode]);
}

class CacheException implements Exception {
  final String message;
  
  CacheException(this.message);
}

class NetworkException implements Exception {
  final String message;
  
  NetworkException(this.message);
}
```

### 3. Base UseCase

**`lib/core/usecases/usecase.dart`**

```dart
import 'package:dartz/dartz.dart';
import '../errors/failures.dart';

abstract class UseCase<Type, Params> {
  Future<Either<Failure, Type>> call(Params params);
}

class NoParams {}
```

### 4. API Client

**`lib/core/network/api_client.dart`**

```dart
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:pretty_dio_logger/pretty_dio_logger.dart';
import '../constants/api_constants.dart';

class ApiClient {
  late final Dio _dio;
  final FlutterSecureStorage _storage;
  
  ApiClient(this._storage) {
    _dio = Dio(
      BaseOptions(
        baseUrl: ApiConstants.baseUrl,
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );
    
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storage.read(key: 'access_token');
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (error, handler) async {
          if (error.response?.statusCode == 401) {
            // Handle token refresh or logout
            await _storage.delete(key: 'access_token');
          }
          return handler.next(error);
        },
      ),
    );
    
    _dio.interceptors.add(
      PrettyDioLogger(
        requestHeader: true,
        requestBody: true,
        responseBody: true,
        responseHeader: false,
        error: true,
        compact: true,
      ),
    );
  }
  
  Dio get dio => _dio;
}
```

## Dependency Injection

**`lib/config/injection.dart`**

```dart
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:get_it/get_it.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/network/api_client.dart';

final getIt = GetIt.instance;

Future<void> configureDependencies() async {
  // External
  final sharedPreferences = await SharedPreferences.getInstance();
  getIt.registerLazySingleton(() => sharedPreferences);
  
  const secureStorage = FlutterSecureStorage();
  getIt.registerLazySingleton(() => secureStorage);
  
  // Core
  getIt.registerLazySingleton(() => ApiClient(getIt()));
  
  // Data sources
  // TODO: Register data sources
  
  // Repositories
  // TODO: Register repositories
  
  // Use cases
  // TODO: Register use cases
}
```

## Example Feature: Authentication

### Domain Layer

**`lib/features/auth/domain/entities/user.dart`**

```dart
import 'package:equatable/equatable.dart';

class User extends Equatable {
  final String id;
  final String email;
  final String fullName;
  final String? phone;
  final String? location;
  final DateTime createdAt;
  
  const User({
    required this.id,
    required this.email,
    required this.fullName,
    this.phone,
    this.location,
    required this.createdAt,
  });
  
  @override
  List<Object?> get props => [id, email, fullName, phone, location, createdAt];
}
```

**`lib/features/auth/domain/repositories/auth_repository.dart`**

```dart
import 'package:dartz/dartz.dart';
import '../../../../core/errors/failures.dart';
import '../entities/user.dart';

abstract class AuthRepository {
  Future<Either<Failure, void>> requestOtp({
    required String email,
    required String fullName,
    String? phone,
    String? location,
  });
  
  Future<Either<Failure, void>> verifyOtp({
    required String email,
    required String otp,
  });
  
  Future<Either<Failure, User>> completeRegistration({
    required String email,
    required String password,
  });
  
  Future<Either<Failure, User>> login({
    required String email,
    required String password,
  });
  
  Future<Either<Failure, void>> logout();
}
```

**`lib/features/auth/domain/usecases/request_otp_usecase.dart`**

```dart
import 'package:dartz/dartz.dart';
import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../repositories/auth_repository.dart';

class RequestOtpUseCase implements UseCase<void, RequestOtpParams> {
  final AuthRepository repository;
  
  RequestOtpUseCase(this.repository);
  
  @override
  Future<Either<Failure, void>> call(RequestOtpParams params) {
    return repository.requestOtp(
      email: params.email,
      fullName: params.fullName,
      phone: params.phone,
      location: params.location,
    );
  }
}

class RequestOtpParams {
  final String email;
  final String fullName;
  final String? phone;
  final String? location;
  
  RequestOtpParams({
    required this.email,
    required this.fullName,
    this.phone,
    this.location,
  });
}
```

### Data Layer

**`lib/features/auth/data/models/user_model.dart`**

```dart
import 'package:json_annotation/json_annotation.dart';
import '../../domain/entities/user.dart';

part 'user_model.g.dart';

@JsonSerializable()
class UserModel extends User {
  const UserModel({
    required super.id,
    required super.email,
    required super.fullName,
    super.phone,
    super.location,
    required super.createdAt,
  });
  
  factory UserModel.fromJson(Map<String, dynamic> json) =>
      _$UserModelFromJson(json);
  
  Map<String, dynamic> toJson() => _$UserModelToJson(this);
  
  User toEntity() => User(
        id: id,
        email: email,
        fullName: fullName,
        phone: phone,
        location: location,
        createdAt: createdAt,
      );
}
```

### Presentation Layer (Riverpod)

**`lib/features/auth/presentation/providers/auth_provider.dart`**

```dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../domain/entities/user.dart';
import '../../domain/usecases/request_otp_usecase.dart';

part 'auth_provider.g.dart';

@riverpod
class AuthNotifier extends _$AuthNotifier {
  @override
  AsyncValue<User?> build() {
    return const AsyncValue.data(null);
  }
  
  Future<void> requestOtp({
    required String email,
    required String fullName,
    String? phone,
    String? location,
  }) async {
    state = const AsyncValue.loading();
    
    // TODO: Call use case
    // final result = await ref.read(requestOtpUseCaseProvider).call(...);
    
    state = const AsyncValue.data(null);
  }
}
```

## Main App

**`lib/main.dart`**

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'config/injection.dart';
import 'config/router.dart';
import 'config/theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  await configureDependencies();
  
  runApp(
    const ProviderScope(
      child: PushMyCVApp(),
    ),
  );
}

class PushMyCVApp extends ConsumerWidget {
  const PushMyCVApp({super.key});
  
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    
    return MaterialApp.router(
      title: 'PushMyCV',
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      routerConfig: router,
      debugShowCheckedModeBanner: false,
    );
  }
}
```

## Code Generation Commands

```bash
# Generate all code
flutter pub run build_runner build --delete-conflicting-outputs

# Watch for changes
flutter pub run build_runner watch --delete-conflicting-outputs

# Clean and rebuild
flutter pub run build_runner clean
flutter pub run build_runner build --delete-conflicting-outputs
```

## Running the App

```bash
# Development
flutter run --dart-define=ENV=development --dart-define=API_URL=http://localhost:3000

# Profile mode
flutter run --profile

# Release mode
flutter run --release
```

## Testing

```bash
# Run all tests
flutter test

# Run with coverage
flutter test --coverage

# Run specific test
flutter test test/features/auth/domain/usecases/request_otp_usecase_test.dart
```

## Next Steps

1. Implement remaining features (profile, resume, jobs, applications)
2. Add proper error handling and loading states
3. Implement offline-first with Hive
4. Add unit tests for all layers
5. Add widget tests for UI components
6. Set up CI/CD pipeline
7. Configure Firebase (optional)
8. Add analytics and crash reporting

## Best Practices

- ✅ Follow Clean Architecture principles
- ✅ Use Riverpod for state management
- ✅ Implement proper error handling
- ✅ Write unit tests for business logic
- ✅ Use code generation for boilerplate
- ✅ Follow Flutter/Dart style guide
- ✅ Keep widgets small and focused
- ✅ Use const constructors where possible
- ✅ Implement proper logging
- ✅ Handle loading and error states
