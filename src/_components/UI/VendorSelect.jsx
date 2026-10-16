'use client';

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { FiChevronDown, FiLoader, FiSearch, FiX } from 'react-icons/fi';
import { getVendors } from '@/services/vendor.service';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;
const MENU_ESTIMATED_HEIGHT = 300; // search box + list, used to decide open-up vs open-down

/*
 * Searchable vendor dropdown backed by GET /smartOffice/vendors.
 * Opens with the first page of vendors, searches by name as the user types
 * (300 ms debounce) and loads the next page when scrolled to the bottom.
 *
 * value:        { vendorId, name } | null
 * onChange:     (vendor | null) => void
 * size:         'md' (forms) | 'sm' (compact table rows)
 * visibleCount: rows shown before the list scrolls (default: fixed 240px height)
 * pageSize:     vendors fetched per request
 */
export default function VendorSelect({
  value,
  onChange,
  placeholder = 'Select Vendor',
  disabled = false,
  size = 'md',
  visibleCount,
  pageSize = PAGE_SIZE,
}) {
  const isSmall = size === 'sm';
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const [vendors, setVendors] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const [listMaxHeight, setListMaxHeight] = useState(240);

  const ref = useRef(null);
  const listRef = useRef(null);
  const searchInputRef = useRef(null);
  const requestIdRef = useRef(0); // drops responses from outdated searches

  // Close when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounce the search box
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const fetchVendors = useCallback(
    async (reset) => {
      const requestId = ++requestIdRef.current;
      reset ? setLoading(true) : setLoadingMore(true);
      setError(false);

      try {
        const { result, totalCount } = await getVendors({
          searchBy: 'name',
          searchKey: debouncedQuery,
          start: reset ? 0 : vendors.length,
          offset: pageSize,
        });
        if (requestId !== requestIdRef.current) return;

        setVendors((prev) => (reset ? result : [...prev, ...result]));
        setTotal(totalCount);
      } catch {
        if (requestId !== requestIdRef.current) return;
        setError(true);
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [debouncedQuery, vendors.length, pageSize]
  );

  // Fresh list each time the dropdown opens or the search changes
  useEffect(() => {
    if (open) fetchVendors(true);
  }, [open, debouncedQuery]);

  // Size the list to exactly `visibleCount` rows; the rest is reached by scrolling
  useLayoutEffect(() => {
    if (!open || !visibleCount || !listRef.current) return;
    const rows = Array.from(listRef.current.querySelectorAll('[data-vendor-option]')).slice(0, visibleCount);
    if (rows.length < visibleCount) return; // fewer rows than the limit — keep the cap until the list fills
    const height = rows.reduce((sum, row) => sum + row.offsetHeight, 0);
    setListMaxHeight(height);
  }, [open, visibleCount, vendors]);

  const hasMore = vendors.length < total;

  const handleScroll = (e) => {
    const el = e.currentTarget;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    if (nearBottom && hasMore && !loading && !loadingMore && !error) fetchVendors(false);
  };

  const handleToggle = () => {
    if (disabled) return;
    if (!open) {
      // Each open starts from the full list
      setQuery('');
      setDebouncedQuery('');
      setTimeout(() => searchInputRef.current?.focus(), 0);
      // Open upward when there isn't room below (e.g. last rows near the page bottom)
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        setOpenUp(spaceBelow < MENU_ESTIMATED_HEIGHT && rect.top > spaceBelow);
      }
    }
    setOpen(!open);
  };

  const handleSelect = (vendor) => {
    onChange(vendor ? { vendorId: vendor.vendorId, name: vendor.name } : null);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative w-full">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={handleToggle}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleToggle()}
        aria-disabled={disabled}
        className={`w-full flex items-center justify-between border border-gray-300 bg-white outline-none text-left focus:border-[#1A73E8] transition-colors ${
          isSmall ? 'px-2 py-1.5 rounded-lg text-sm' : 'px-4 py-3 rounded-[14px] text-[15px]'
        } ${
          disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
        }`}
        style={{ color: value ? '#1e293b' : '#94a3b8' }}
      >
        <span className="truncate">{value?.name || placeholder}</span>
        <span className="flex items-center gap-2 shrink-0 ml-2">
          {value && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSelect(null);
              }}
              className="w-5 h-5 grid place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
              aria-label="Clear vendor"
            >
              <FiX className="w-3.5 h-3.5" />
            </button>
          )}
          <FiChevronDown
            className="text-slate-500 transition-transform duration-200"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </span>
      </div>

      {open && (
        <div
          className={`absolute left-0 w-full bg-white rounded-[14px] z-[9999] p-2 flex flex-col ${
            openUp ? 'bottom-[calc(100%+6px)]' : 'top-[calc(100%+6px)]'
          } ${isSmall ? 'min-w-[240px]' : ''}`}
          style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.13)' }}
        >
          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 mb-1 rounded-[10px] bg-slate-50">
            <FiSearch className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search vendor by name"
              className={`w-full bg-transparent outline-none text-slate-800 placeholder:text-slate-400 ${
                isSmall ? 'text-sm' : 'text-[15px]'
              }`}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label="Clear search"
              >
                <FiX className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Options */}
          <div
            ref={listRef}
            className="overflow-y-auto"
            style={{ maxHeight: `${visibleCount ? listMaxHeight : 240}px` }}
            onScroll={handleScroll}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-6 text-[14px] text-slate-400">
                <FiLoader className="animate-spin" /> Loading vendors...
              </div>
            ) : error && vendors.length === 0 ? (
              <div className="py-5 text-center text-[14px] text-slate-500">
                Couldn&apos;t load vendors.{' '}
                <button
                  type="button"
                  onClick={() => fetchVendors(true)}
                  className="text-[#1A73E8] font-semibold cursor-pointer"
                >
                  Try again
                </button>
              </div>
            ) : vendors.length === 0 ? (
              <div className="py-6 text-center text-[14px] text-slate-400">
                {debouncedQuery ? 'No vendors match your search' : 'No vendors added yet'}
              </div>
            ) : (
              <>
                {vendors.map((vendor) => {
                  const isSelected = vendor.vendorId === value?.vendorId;
                  return (
                    <button
                      key={vendor.vendorId}
                      data-vendor-option
                      type="button"
                      onMouseDown={() => handleSelect(vendor)}
                      className={[
                        'block w-full text-left cursor-pointer border-none rounded-lg transition-colors duration-150',
                        isSmall ? 'px-3 py-2' : 'px-4 py-2.5',
                        isSelected ? 'bg-indigo-50' : 'bg-transparent hover:bg-slate-50',
                      ].join(' ')}
                    >
                      <span
                        className={`block font-['Nunito_Sans'] font-medium leading-[136%] text-[#333333] ${
                          isSmall ? 'text-sm' : 'text-[16px]'
                        }`}
                      >
                        {vendor.name}
                      </span>
                      {vendor.location && (
                        <span className={`block text-slate-400 ${isSmall ? 'text-xs' : 'text-[13px]'}`}>{vendor.location}</span>
                      )}
                    </button>
                  );
                })}

                {loadingMore && (
                  <div className="flex items-center justify-center gap-2 py-3 text-[13px] text-slate-400">
                    <FiLoader className="animate-spin" /> Loading more...
                  </div>
                )}
                {error && !loadingMore && (
                  <div className="py-3 text-center text-[13px] text-slate-500">
                    Couldn&apos;t load more.{' '}
                    <button
                      type="button"
                      onClick={() => fetchVendors(false)}
                      className="text-[#1A73E8] font-semibold cursor-pointer"
                    >
                      Try again
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
