#include<type_traits>

////////////////////////
// Integral constants //
////////////////////////

template<class Ty, Ty V>
struct integral_constant {
  static constexpr Ty value = V;
};

template <bool B>
using bool_constant = integral_constant<bool, B>;

using true_type =bool_constant<true>;
using false_type =bool_constant<false>;

static_assert(!std::is_same_v<std::integral_constant<bool, true>, true_type>);
static_assert(std::integral_constant<bool, true>::value == true_type::value);

//////////////////
// is_reference //
//////////////////

template<class T> struct is_reference : std::integral_constant<int, 0> {};
template<class T> struct is_reference<T&> : std::integral_constant<int, 1> {};
// The one above will always shadow the one below
template<class T> struct is_reference<T&&> : std::integral_constant<int, 2> {};

template<class T>
inline constexpr bool is_reference_v = is_reference<T>::value; 

static_assert(is_reference_v<int> == 0);
static_assert(is_reference_v<int&> == 1);

// Reference collapsing
// This matches T& with T = int&&
static_assert(is_reference_v<int&&> == 1);

// !! Note that this is quite different from normal overload resolution
// One one case we have different value categories -> choose which overload
// In the other we have different types -> choose which template specialisation

//////////////////////
// remove_reference //
//////////////////////

template<class T> struct remove_reference : std::integral_constant<int, 0> { using type = T; };
template<class T> struct remove_reference<T&> : std::integral_constant<int, 1> { using type = T; };
template<class T> struct remove_reference<T&&> : std::integral_constant<int, 2> { using type = T; };

template<class T> using remove_reference_t = typename remove_reference<T>::type;

template<class T> inline constexpr bool remove_reference_v = remove_reference<T>::value; 

static_assert(remove_reference<int>::value == 0);
static_assert(remove_reference<int&>::value == 1);
static_assert(remove_reference<int&&>::value == 2);

static_assert(remove_reference_v<int> == 0);
static_assert(remove_reference_v<int&> == 1);
// static_assert(remove_reference_v<int&&> == 2);

static_assert(std::is_same_v<remove_reference_t<int>, int>);
static_assert(std::is_same_v<remove_reference_t<int&>, int>);
static_assert(std::is_same_v<remove_reference_t<int&&>, int>);
