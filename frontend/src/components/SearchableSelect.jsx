import { useState, useRef, useEffect } from 'react'
import { ChevronDown, X } from 'lucide-react'

export default function SearchableSelect({
  id,
  name,
  value,
  onChange,
  options = [],
  placeholder = 'Select...',
  required = false,
  disabled = false,
  style = {},
  getOptionValue = null, // Function to extract actual value from option display string
  allowCustom = false // Allow typing custom values not in options
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef(null)
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Get display value - if getOptionValue is provided, find the matching option
  const getDisplayValue = () => {
    if (!value) return ''
    if (getOptionValue) {
      const matchingOption = options.find(opt => {
        const optValue = getOptionValue(opt)
        return optValue === value
      })
      return matchingOption || value
    }
    return value
  }
  const displayValue = getDisplayValue()

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        // If allowCustom and there's a search term, accept it as custom value
        if (allowCustom && searchTerm && !options.includes(searchTerm)) {
          onChange({
            target: {
              name,
              value: searchTerm
            }
          })
        }
        setIsOpen(false)
        setSearchTerm('')
        setHighlightedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [allowCustom, searchTerm, options, name, onChange])

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(e) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        )
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (highlightedIndex >= 0 && filteredOptions.length > 0) {
          handleSelect(filteredOptions[highlightedIndex])
        } else if (allowCustom && searchTerm) {
          // Accept custom value on Enter
          onChange({
            target: {
              name,
              value: searchTerm
            }
          })
          setIsOpen(false)
          setSearchTerm('')
          setHighlightedIndex(-1)
        }
      } else if (e.key === 'Escape') {
        setIsOpen(false)
        setSearchTerm('')
        setHighlightedIndex(-1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, filteredOptions, highlightedIndex])

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && dropdownRef.current) {
      const highlightedElement = dropdownRef.current.children[highlightedIndex]
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [highlightedIndex])

  function handleSelect(selectedValue) {
    const actualValue = getOptionValue ? getOptionValue(selectedValue) : selectedValue
    onChange({
      target: {
        name,
        value: actualValue
      }
    })
    setIsOpen(false)
    setSearchTerm('')
    setHighlightedIndex(-1)
  }

  function handleInputChange(e) {
    const newSearchTerm = e.target.value
    setSearchTerm(newSearchTerm)
    setIsOpen(true)
    setHighlightedIndex(-1)
    
    // If allowCustom is true, update the value directly as user types
    if (allowCustom) {
      onChange({
        target: {
          name,
          value: newSearchTerm
        }
      })
    }
  }

  function handleInputFocus() {
    setIsOpen(true)
    setSearchTerm('')
  }

  function handleClear(e) {
    e.stopPropagation()
    onChange({
      target: {
        name,
        value: ''
      }
    })
    setSearchTerm('')
    setIsOpen(false)
  }

  const showDropdown = isOpen && filteredOptions.length > 0

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <div style={styles.inputContainer}>
        <input
          ref={inputRef}
          type="text"
          id={id}
          name={name}
          value={isOpen ? searchTerm : displayValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          style={{ ...styles.input, ...style }}
          autoComplete="off"
        />
        <div style={styles.icons}>
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              style={styles.clearButton}
              tabIndex={-1}
            >
              <X size={16} />
            </button>
          )}
          <ChevronDown 
            size={20} 
            style={{
              ...styles.chevron,
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s'
            }}
          />
        </div>
      </div>
      
      {showDropdown && (
        <div ref={dropdownRef} style={styles.dropdown}>
          {filteredOptions.map((option, index) => (
            <div
              key={option}
              onClick={() => handleSelect(option)}
              onMouseEnter={() => setHighlightedIndex(index)}
              style={{
                ...styles.option,
                ...(index === highlightedIndex ? styles.optionHighlighted : {}),
                ...(option === value ? styles.optionSelected : {})
              }}
            >
              {option}
            </div>
          ))}
        </div>
      )}
      
      {isOpen && filteredOptions.length === 0 && searchTerm && (
        <div style={styles.dropdown}>
          <div style={styles.noResults}>No results found</div>
        </div>
      )}
    </div>
  )
}

const styles = {
  inputContainer: {
    position: 'relative',
    width: '100%'
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    paddingRight: '3rem',
    fontSize: '1rem',
    border: '1px solid var(--border-color)',
    borderRadius: '0.375rem',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    outline: 'none'
  },
  icons: {
    position: 'absolute',
    right: '0.75rem',
    top: '50%',
    transform: 'translateY(-50%)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    pointerEvents: 'none'
  },
  clearButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.25rem',
    pointerEvents: 'auto',
    borderRadius: '0.25rem'
  },
  clearButtonHover: {
    backgroundColor: 'var(--border-color)'
  },
  chevron: {
    color: 'var(--text-secondary)',
    pointerEvents: 'none'
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: '0.25rem',
    backgroundColor: 'var(--bg-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: '0.375rem',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    maxHeight: '300px',
    overflowY: 'auto',
    zIndex: 1000
  },
  option: {
    padding: '0.75rem',
    cursor: 'pointer',
    color: 'var(--text-primary)',
    borderBottom: '1px solid var(--border-color)',
    transition: 'background-color 0.15s'
  },
  optionHighlighted: {
    backgroundColor: 'var(--primary-color)',
    color: 'white'
  },
  optionSelected: {
    backgroundColor: 'var(--bg-secondary)',
    fontWeight: 600
  },
  noResults: {
    padding: '0.75rem',
    color: 'var(--text-secondary)',
    textAlign: 'center',
    fontStyle: 'italic'
  }
}

