import { useState } from "react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  initialValue?: string;
}

export default function SearchBar({
  onSearch,
  placeholder = "Search...",
  initialValue = "",
}: SearchBarProps) {
  const [value, setValue] = useState(initialValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(value.trim());
  };

  const handleClear = () => {
    setValue("");
    onSearch("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 transition-colors focus:border-gray-300 focus:bg-white focus:outline-none"
      />
      <button
        type="submit"
        className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
      >
        Search
      </button>
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          Clear
        </button>
      )}
    </form>
  );
}
