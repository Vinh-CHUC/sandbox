#include "algos/intervals.h"

#include <algorithm>
#include <ranges>

Interval::Interval(int begin, int end) : m_begin(begin), m_end(end) {}

std::optional<Interval> Interval::make_interval(int begin, int end) {
  if (begin < end) {
    return Interval{begin, end};
  } else {
    return std::nullopt;
  }
}

bool Interval::intersects_with(const Interval &other) {
  if (this->m_end >= other.m_begin && this->m_begin <= other.m_end) {
    return true;
  } else {
    return false;
  }
}

int Interval::getBegin() const { return m_begin; }

int Interval::getEnd() const { return m_end; }

bool operator==(const Interval &lhs, const Interval &rhs) {
  return (lhs.getBegin() == rhs.getBegin() && lhs.getEnd() == rhs.getEnd());
}

Interval merge(const Interval &lhs, const Interval &rhs) {
  return Interval::make_interval(std::min(lhs.getBegin(), rhs.getBegin()),
                                 std::max(lhs.getEnd(), rhs.getEnd()))
      .value();
}

std::vector<Interval> merge_intervals(const std::vector<Interval> &intervals) {
  auto ret = std::vector<Interval>{};

  auto input = intervals;

  std::sort(input.begin(), input.end(),
            [](const Interval &lhs, const Interval &rhs) {
              return lhs.getBegin() < rhs.getBegin();
            });

  for (int i = 0; i < input.size(); i++) {
    if (ret.empty()) {
      ret.push_back(input[i]);
      continue;
    }

    if (ret.back().intersects_with(input[i])) {
      ret.back() = merge(ret.back(), input[i]);
    } else {
      ret.push_back(input[i]);
    }
  }

  return ret;
}

std::vector<Interval> do_merge_intervals_rec(std::vector<Interval> merged,
                                             std::vector<Interval> to_merge) {
  if (to_merge.empty()) {
    return merged;
  }

  auto inter = to_merge.back();
  to_merge.pop_back();

  if (merged.empty() || !merged.back().intersects_with(inter)) {
    merged.push_back(inter);
  } else {
    merged.back() = merge(merged.back(), inter);
  }

  return do_merge_intervals_rec(std::move(merged), std::move(to_merge));
}

std::vector<Interval>
merge_intervals_rec(const std::vector<Interval> &intervals) {
  auto ret = std::vector<Interval>{};

  auto input = intervals;

  std::sort(input.begin(), input.end(),
            [](const Interval &lhs, const Interval &rhs) {
              return lhs.getBegin() > rhs.getBegin();
            });

  return do_merge_intervals_rec(std::vector<Interval>{}, std::move(input));
}
