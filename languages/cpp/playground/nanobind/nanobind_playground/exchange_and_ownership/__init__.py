from .exchange_and_ownership_ext import double_it, double_it_mut, double_it_py
from .bind_ext import double_it as bind_double_it, double_it_mut as bind_double_it_mut, IntVector

from .exchange_and_ownership_ext.ownership_ext import (
    make_data,
    kaboom,
    create_uptr,
    consume_uptr,
    create_sptr,
    receive_sptr,
    receive_callback_and_call,
    ping_pong
)
