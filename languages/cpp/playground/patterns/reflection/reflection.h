#include<type_traits>
#include<utility>


struct Anything {
    template <typename T>
    operator T() const;  // No definition needed
};

namespace detail {
  template <typename T, typename Is, typename=void>
  struct is_aggregate_constructible_from_n_impl
    : std::false_type{};

  template <typename T, std::size_t...Is>
  struct is_aggregate_constructible_from_n_impl<
    T,
    std::index_sequence<Is...>,
    std::void_t<decltype(T{(void(Is),Anything{})...})>
  > : std::true_type{};
} // namespace detail

template <typename T, std::size_t N>
using is_aggregate_constructible_from_n = detail::is_aggregate_constructible_from_n_impl<T,std::make_index_sequence<N>>;
