#include <optional>
#include <ostream>
#include <vector>

class Interval {
  int m_begin;
  int m_end;

  Interval(int begin, int end);

  public:
    static std::optional<Interval> make_interval(int begin, int end);

    bool intersects_with(const Interval& other);

    int getBegin() const;
    int getEnd() const;
};

// Outside your class definition
std::ostream& operator<<(std::ostream& os, const Interval& interval) {
    return os << "[" << interval.getBegin() << ", " << interval.getEnd() << "]";
}

bool operator==(const Interval&, const Interval&);

Interval merge(const Interval&, const Interval&);

std::vector<Interval> merge_intervals(const std::vector<Interval>& intervals);
