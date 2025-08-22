import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { debounce } from "@/lib/utils";
import { Agent } from "@shared/schema";
import { useLocation } from "wouter";

interface SearchBarProps {
  large?: boolean;
  onSearch?: (query: string) => void;
  initialQuery?: string;
}

export default function SearchBar({ large = false, onSearch, initialQuery = "" }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [, navigate] = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search function
  const debouncedSearch = debounce((value: string) => {
    if (onSearch) {
      onSearch(value);
    }
  }, 300);

  // Fetch suggestions based on search query
  const { data: suggestions, isLoading } = useQuery<Agent[]>({
    queryKey: [query ? `/api/agents/suggestions?query=${encodeURIComponent(query)}` : null],
    enabled: query.length > 1,
  });

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);

    if (value.length > 1) {
      setIsDropdownOpen(true);
    } else {
      setIsDropdownOpen(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (agentId: number) => {
    setIsDropdownOpen(false);
    navigate(`/agent/${agentId}`);
  };

  // Handle search submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className={`relative ${large ? "w-full max-w-xl mx-auto" : "w-full"}`}>
      <form onSubmit={handleSubmit}>
        <div className={`relative ${large ? "shadow-lg rounded-lg" : "shadow-sm rounded-md"}`}>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className={`${large ? "h-5 w-5" : "h-4 w-4"} text-gray-400`} />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleChange}
            className={`block w-full ${
              large ? "pl-10 pr-3 py-4 text-lg" : "pl-9 pr-3 py-2 text-sm"
            } border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#E53E3E] focus:border-transparent shadow-sm`}
            placeholder="Search for an agent..."
          />
        </div>
      </form>

      {/* Autocomplete dropdown */}
      {isDropdownOpen && (
        <div
          ref={dropdownRef}
          className={`absolute z-10 w-full mt-1 bg-white shadow-lg rounded-md overflow-hidden ${
            large ? "search-autocomplete max-h-72" : "max-h-60"
          } overflow-y-auto`}
        >
          {isLoading ? (
            <div className="px-4 py-2 text-sm text-gray-500">Loading suggestions...</div>
          ) : suggestions && suggestions.length > 0 ? (
            suggestions.map((agent) => (
              <div
                key={agent.id}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                onClick={() => handleSuggestionClick(agent.id)}
              >
                <div className="h-8 w-8 rounded-full bg-gray-200 mr-3 overflow-hidden">
                  {agent.avatarUrl ? (
                    <img 
                      src={agent.avatarUrl} 
                      alt={`${agent.name} avatar`} 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-[#E53E3E] text-white">
                      {agent.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{agent.name}</p>
                  <p className="text-xs text-gray-500">{agent.title}</p>
                </div>
              </div>
            ))
          ) : query.length > 1 ? (
            <div className="px-4 py-2 text-sm text-gray-500">No agents found</div>
          ) : null}
        </div>
      )}
    </div>
  );
}
