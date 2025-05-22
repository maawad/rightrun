# Compiler settings
HIPCC = hipcc
CXXFLAGS = -O3 -std=c++17
HIPFLAGS = -O3

# Source files
SRC = template.hip
OBJ = $(SRC:.hip=.o)
EXE = $(SRC:.hip=)

# Default target
all: $(EXE)

# Compile HIP source
%.o: %.hip
	$(HIPCC) $(HIPFLAGS) -c $< -o $@

# Link executable
$(EXE): $(OBJ)
	$(HIPCC) $(OBJ) -o $@

# Clean build artifacts
clean:
	rm -f $(OBJ) $(EXE)

.PHONY: all clean
