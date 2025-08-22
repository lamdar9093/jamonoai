import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Agent } from "@shared/schema";
import SearchBar from "@/components/search-bar";
import AgentCard from "@/components/agent-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Filter, X } from "lucide-react";

export default function Search() {
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isFilterVisible, setIsFilterVisible] = useState(false);

  // Parse query parameter from URL
  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1]);
    const query = params.get("q");
    const category = params.get("category");
    
    if (query) {
      setSearchQuery(query);
    }
    
    if (category) {
      setSelectedCategory(category);
    }
  }, [location]);

  // Fetch agents based on search criteria
  const { data: agents, isLoading } = useQuery<Agent[]>({
    queryKey: [
      `/api/agents/search`, 
      { query: searchQuery, skills: selectedSkills, category: selectedCategory }
    ],
  });

  // Fetch available skills for filter
  const { data: availableSkills } = useQuery<string[]>({
    queryKey: ["/api/skills"],
  });

  // Toggle filter visibility on mobile
  const toggleFilter = () => {
    setIsFilterVisible(!isFilterVisible);
  };

  // Handle skill selection
  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedSkills([]);
    setSelectedCategory(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-4 md:mb-0">
          {searchQuery
            ? `Search results for "${searchQuery}"`
            : selectedCategory
            ? `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Agents`
            : "All Agents"}
        </h1>
        
        <div className="w-full md:w-96">
          <SearchBar initialQuery={searchQuery} onSearch={handleSearch} />
        </div>
      </div>

      <div className="lg:flex gap-8">
        {/* Filters - Desktop */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-slate-800">Filters</h2>
              {(selectedSkills.length > 0 || selectedCategory) && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-[#E53E3E] hover:text-red-700"
                >
                  Clear all
                </button>
              )}
            </div>
            
            {/* Skills filter */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Skills</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-5 w-full" />
                  ))
                ) : (
                  availableSkills?.map((skill) => (
                    <div key={skill} className="flex items-center">
                      <input
                        id={`skill-${skill}`}
                        type="checkbox"
                        className="h-4 w-4 text-[#E53E3E] focus:ring-[#E53E3E] border-gray-300 rounded"
                        checked={selectedSkills.includes(skill)}
                        onChange={() => toggleSkill(skill)}
                      />
                      <label
                        htmlFor={`skill-${skill}`}
                        className="ml-2 text-sm text-gray-700"
                      >
                        {skill}
                      </label>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            {/* Categories filter */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Categories</h3>
              <div className="space-y-2">
                {["devops", "cloud", "programming", "security", "database", "ai"].map(
                  (category) => (
                    <div key={category} className="flex items-center">
                      <input
                        id={`category-${category}`}
                        type="radio"
                        name="category"
                        className="h-4 w-4 text-[#E53E3E] focus:ring-[#E53E3E] border-gray-300"
                        checked={selectedCategory === category}
                        onChange={() => setSelectedCategory(category)}
                      />
                      <label
                        htmlFor={`category-${category}`}
                        className="ml-2 text-sm text-gray-700"
                      >
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </label>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Filter toggle - Mobile */}
        <div className="lg:hidden mb-4">
          <Button 
            variant="outline" 
            onClick={toggleFilter}
            className="flex items-center gap-2"
          >
            <Filter size={16} />
            Filters
            {(selectedSkills.length > 0 || selectedCategory) && (
              <span className="ml-1 bg-[#E53E3E] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {selectedSkills.length + (selectedCategory ? 1 : 0)}
              </span>
            )}
          </Button>
          
          {/* Mobile filters */}
          {isFilterVisible && (
            <div className="mt-2 p-4 bg-white rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold text-slate-800">Filters</h2>
                <div className="flex items-center gap-2">
                  {(selectedSkills.length > 0 || selectedCategory) && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-[#E53E3E] hover:text-red-700"
                    >
                      Clear all
                    </button>
                  )}
                  <button onClick={toggleFilter}>
                    <X size={18} />
                  </button>
                </div>
              </div>
              
              {/* Skills */}
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {availableSkills?.slice(0, 10).map((skill) => (
                    <button
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        selectedSkills.includes(skill)
                          ? "bg-[#E53E3E] text-white"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Categories */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {["devops", "cloud", "programming", "security", "database", "ai"].map(
                    (category) => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(
                          selectedCategory === category ? null : category
                        )}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          selectedCategory === category
                            ? "bg-[#E53E3E] text-white"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Selected filters display */}
          {(selectedSkills.length > 0 || selectedCategory) && (
            <div className="flex flex-wrap gap-2 mt-3">
              {selectedCategory && (
                <div className="flex items-center bg-gray-100 px-2 py-1 rounded-full text-xs">
                  <span>{selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}</span>
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="ml-1 text-gray-500 hover:text-gray-700"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              
              {selectedSkills.map((skill) => (
                <div key={skill} className="flex items-center bg-gray-100 px-2 py-1 rounded-full text-xs">
                  <span>{skill}</span>
                  <button
                    onClick={() => toggleSkill(skill)}
                    className="ml-1 text-gray-500 hover:text-gray-700"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Results grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 p-6">
                  <div className="flex items-start">
                    <Skeleton className="h-16 w-16 rounded-full mr-4" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-16 w-full mt-4" />
                  <div className="flex mt-4 gap-2">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                  <div className="flex justify-between mt-6">
                    <Skeleton className="h-10 w-24 rounded-md" />
                    <Skeleton className="h-10 w-24 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {agents && agents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {agents.map((agent) => (
                    <AgentCard key={agent.id} agent={agent} />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No agents found</h3>
                  <p className="text-gray-500 mb-6">
                    Try adjusting your search or filter criteria
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={clearFilters}
                    className="mx-auto"
                  >
                    Clear all filters
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
