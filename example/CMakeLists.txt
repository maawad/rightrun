cmake_minimum_required(VERSION 3.8 FATAL_ERROR)

project(MyProject LANGUAGES CXX HIP)

# Set C++ and HIP standards
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_HIP_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED TRUE)
set(CMAKE_HIP_STANDARD_REQUIRED TRUE)

# Compiler flags
set(CMAKE_CXX_FLAGS_RELEASE "-O3")
set(CMAKE_HIP_FLAGS_RELEASE "-O3")

# Build options
option(BUILD_TESTS "Build tests" ON)

# Main library target
add_library(${PROJECT_NAME} INTERFACE)
add_library(${PROJECT_NAME}::${PROJECT_NAME} ALIAS ${PROJECT_NAME})

# Include directories
set(INCLUDE_DIRS
    ${CMAKE_CURRENT_SOURCE_DIR}/include
)

# Compiler flags
set(CXX_FLAGS
    $<IF:$<CXX_COMPILER_ID:MSVC>,
    /std:c++17,
    --std=c++17
    >)

# Add include directories and compile options
target_include_directories(${PROJECT_NAME}
    INTERFACE ${INCLUDE_DIRS}
)

target_compile_options(${PROJECT_NAME} INTERFACE
    $<$<COMPILE_LANGUAGE:CXX>:${CXX_FLAGS}>
)

# Add subdirectories
add_subdirectory(include)

if(BUILD_TESTS)
    add_subdirectory(test)
endif()