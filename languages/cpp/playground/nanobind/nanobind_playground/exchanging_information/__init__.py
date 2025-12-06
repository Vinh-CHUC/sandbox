from .exchanging_information_ext import double_it, double_it_mut, double_it_py
from .bind_ext import double_it as bind_double_it, double_it_mut as bind_double_it_mut, IntVector

from .exchanging_information_ext.ownership_ext import (
    make_data,
    kaboom,
    create_uptr,
    consume_uptr,
)
