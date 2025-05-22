#include <hip/hip_runtime.h>
#include <thrust/device_vector.h>
#include <thrust/host_vector.h>
#include <thrust/sequence.h>

template <typename T>
__global__ void add(T* output,
                    const T* input_a,
                    const T* input_b,
                    const std::size_t num_elements) {
  const auto thread_idx = blockIdx.x * blockDim.x + threadIdx.x;
  if (thread_idx < num_elements) {
    output[thread_idx] = input_a[thread_idx] + input_b[thread_idx];
  }
}

int main() {
  using T = float;

  const auto num_elements = 64;

  thrust::device_vector<T> d_output(num_elements);
  thrust::device_vector<T> d_input_a(num_elements);
  thrust::device_vector<T> d_input_b(num_elements);

  thrust::sequence(d_input_a.begin(), d_input_a.end());
  thrust::sequence(d_input_b.begin(), d_input_b.end());

  add<<<1, 1024>>>(d_output.data().get(), d_input_a.data().get(),
                   d_input_b.data().get(), num_elements);

  thrust::copy(d_output.begin(), d_output.end(),
               std::ostream_iterator<T>(std::cout, "\n"));
}