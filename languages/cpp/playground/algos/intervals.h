#include <optional>

class Interval {
  int m_begin;
  int m_end;

  Interval(int begin, int end);

  public:
    static std::optional<Interval> make_interval(int begin, int end);

    bool intersects_with(const Interval& other);
};
