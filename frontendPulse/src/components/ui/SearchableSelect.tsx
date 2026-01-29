import Select, { type StylesConfig, type GroupBase } from 'react-select';

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  isClearable?: boolean;
}

const customStyles: StylesConfig<Option, false, GroupBase<Option>> = {
  control: (base, state) => ({
    ...base,
    backgroundColor: 'rgba(2, 6, 23, 0.5)', // slate-950/50
    borderColor: state.isFocused ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255, 255, 255, 0.1)', // primary/50 vs white/10
    borderRadius: '0.75rem', // rounded-xl
    color: 'white',
    boxShadow: state.isFocused ? '0 0 0 4px rgba(59, 130, 246, 0.1)' : 'none', // ring-primary/10
    '&:hover': {
      borderColor: state.isFocused ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255, 255, 255, 0.2)',
    },
    padding: '2px',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: 'rgba(15, 23, 42, 0.95)', // slate-900/95
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '0.75rem',
    backdropFilter: 'blur(16px)',
    overflow: 'hidden',
    zIndex: 9999,
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected 
      ? 'rgba(59, 130, 246, 0.2)' 
      : state.isFocused 
        ? 'rgba(255, 255, 255, 0.05)' 
        : 'transparent',
    color: state.isSelected ? 'white' : 'rgba(203, 213, 225, 1)', // slate-300
    cursor: 'pointer',
    fontSize: '0.875rem',
    padding: '10px 16px',
    '&:active': {
      backgroundColor: 'rgba(59, 130, 246, 0.3)',
    }
  }),
  singleValue: (base) => ({
    ...base,
    color: 'white',
    fontSize: '0.875rem',
  }),
  input: (base) => ({
    ...base,
    color: 'white',
    fontSize: '0.875rem',
  }),
  placeholder: (base) => ({
    ...base,
    color: 'rgba(71, 85, 105, 1)', // slate-600
    fontSize: '0.875rem',
  }),
  dropdownIndicator: (base) => ({
    ...base,
    color: 'rgba(100, 116, 139, 1)', // slate-500
    '&:hover': {
      color: 'white',
    }
  }),
  indicatorSeparator: () => ({
    display: 'none',
  }),
  clearIndicator: (base) => ({
    ...base,
    color: 'rgba(100, 116, 139, 1)',
    '&:hover': {
      color: 'white',
    }
  })
};

const SearchableSelect = ({ options, value, onChange, placeholder = 'Select...', className = "", isClearable = false }: SearchableSelectProps) => {
  const selectedOption = options.find(o => o.value === value) || null;

  return (
    <div className={className}>
      <Select
        options={options}
        value={selectedOption}
        onChange={(option) => onChange(option ? option.value : '')}
        placeholder={placeholder}
        styles={customStyles}
        isSearchable={true}
        isClearable={isClearable}
        classNamePrefix="react-select"
      />
    </div>
  );
};

export default SearchableSelect;
