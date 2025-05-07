#include "algos/intervals.h"
Interval::Interval(int begin, int end): m_begin(begin), m_end(end) {}

std::optional<Interval> Interval::make_interval(int begin, int end){
  if (begin < end){
    return Interval{begin, end};
  } else {
    return std::nullopt;
  }
}

bool Interval::intersects_with(const Interval& other){
  if(this->m_end >= other.m_begin && this->m_begin <= other.m_end){
    return true;
  } else {
    return false;
  }
}
