from .exchange_and_ownership_ext import double_it, double_it_mut, double_it_py
from .bind_ext import double_it as bind_double_it, double_it_mut as bind_double_it_mut, IntVector

from .exchange_and_ownership_ext.ownership_ext import (
    make_data,
    kaboom,
    create_move_only_string,
    consume_move_only_string,
    create_uptr,
    consume_uptr,
    consume_uptr_2,
    create_sptr,
    receive_sptr,
    ping_pong
)

from .capsule_ext import (
    make_owning_capsule, make_coowning_capsule, make_coowning_capsule_noret
)

from .refcount_ext import (
    get_new_list_ptr,
    get_borrowed_ptr,
    manual_incref,
    manual_decref,
    get_refcount,
    wrap_steal,
    wrap_borrow,
    borrow_refcount,
    underflow_steal
)
