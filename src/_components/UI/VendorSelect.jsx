'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FiChevronDown, FiLoader, FiSearch, FiX } from 'react-icons/fi';
import { getVendors } from '@/services/vendor.service';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

/*
 * Searchable vendor dropdown backed by GET /smartOffice/vendors.
 * Opens with the first 20 vendors, searches by name as the user types
 * (300 ms debounce) and loads the next page when scrolled to the bottom.
 *
 * value:    { vendorId, name } | null
 * onChange: (vendor | null) => void
 */
export default function VendorSelect({ value, onChange, placeholder = 'Select Vendor', disabled = false }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const [vendors, setVendors] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);

  const ref = useRef(null);
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
          offset: PAGE_SIZE,
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
    [debouncedQuery, vendors.length]
  );

  // Fresh list each time the dropdown opens or the search changes
  useEffect(() => {
    if (open) fetchVendors(true);
  }, [open, debouncedQuery]);

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
        className={`w-full flex items-center justify-between px-4 py-3 border border-gray-300 rounded-[14px] bg-white text-[15px] outline-none text-left focus:border-[#1A73E8] transition-colors ${
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
          className="absolute top-[calc(100%+6px)] left-0 w-full bg-white rounded-[14px] z-[9999] p-2 flex flex-col"
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
              className="w-full bg-transparent outline-none text-[15px] text-slate-800 placeholder:text-slate-400"
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
          <div className="overflow-y-auto" style={{ maxHeight: '240px' }} onScroll={handleScroll}>
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
                      type="button"
                      onMouseDown={() => handleSelect(vendor)}
                      className={[
                        'block w-full text-left px-4 py-2.5 cursor-pointer border-none rounded-lg transition-colors duration-150',
                        isSelected ? 'bg-indigo-50' : 'bg-transparent hover:bg-slate-50',
                      ].join(' ')}
                    >
                      <span className="block font-['Nunito_Sans'] font-medium text-[16px] leading-[136%] text-[#333333]">
                        {vendor.name}
                      </span>
                      {vendor.location && (
                        <span className="block text-[13px] text-slate-400">{vendor.location}</span>
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
