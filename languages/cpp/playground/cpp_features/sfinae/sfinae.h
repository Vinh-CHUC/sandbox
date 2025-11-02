#include<type_traits>

////////////
////////////
// Basics //
////////////
////////////

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
inline constexpr int is_reference_v = is_reference<T>::value; 

static_assert(is_reference_v<int> == 0);
static_assert(is_reference_v<int&> == 1);
static_assert(is_reference_v<int&&> == 2);

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

template<class T> inline constexpr int remove_reference_v = remove_reference<T>::value; 

static_assert(remove_reference_v<int> == 0);
static_assert(remove_reference_v<int&> == 1);
static_assert(remove_reference_v<int&&> == 2);

static_assert(std::is_same_v<remove_reference_t<int>, int>);
static_assert(std::is_same_v<remove_reference_t<int&>, int>);
static_assert(std::is_same_v<remove_reference_t<int&&>, int>);

////////////
// void_t //
////////////
template<class...> using void_t = void;

template<class T, typename> struct MyTemplate : std::integral_constant<int, 0> {using type = T; };

// In the template argument list, we want to introduce a type expression such that
// "it doesn't compile" <==> the specialisation is discarded
//
// "it compiles" <==> the specialisation is selected, hence the type expression has to "compile"
// and also evaluate to the same expression as per the call site
//
// So we use this void_t as a trick/default
template<class T> struct MyTemplate<T, void_t<T&>> : std::integral_constant<int, 1> {using type = T; };

static_assert(MyTemplate<int, void>::value == 1);
static_assert(MyTemplate<void, void>::value == 0);

// Using a default type = void to make this more ergonomic
template<class T, typename U = void> struct MyTemplate2 : std::integral_constant<int, 0> {using type = T; };
template<class T> struct MyTemplate2<T, void_t<T&>> : std::integral_constant<int, 1> {using type = T; };

static_assert(MyTemplate2<int>::value == 1);
static_assert(MyTemplate2<void>::value == 0);
