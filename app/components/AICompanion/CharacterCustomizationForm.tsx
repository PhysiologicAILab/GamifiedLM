import type {
  CharacterCustomization,
  CharacterPersonality,
  CharacterIdentity,
  CharacterGuidingStyle
} from '../types';

interface CharacterCustomizationFormProps {
  customization: CharacterCustomization;
  personalityTraits: CharacterPersonality[];
  characterIdentities: CharacterIdentity[];
  guidingStyles: CharacterGuidingStyle[];
  onCustomizationChange: (customization: CharacterCustomization) => void;
  onSubmit: () => void;
  isGenerating: boolean;
  submitButtonText: string;
  showCancelButton?: boolean;
  onCancel?: () => void;
}

export default function CharacterCustomizationForm({
  customization,
  personalityTraits,
  characterIdentities,
  guidingStyles,
  onCustomizationChange,
  onSubmit,
  isGenerating,
  submitButtonText,
  showCancelButton = false,
  onCancel
}: CharacterCustomizationFormProps) {
  const updateCustomization = (updates: Partial<CharacterCustomization>) => {
    onCustomizationChange({ ...customization, ...updates });
  };

  return (
    <div className="space-y-6">
      {/* Character Name */}
      <div>
        <label className="block text-sm font-medium text-slate-200 mb-2">
          Character Name *
        </label>
        <input
          type="text"
          value={customization.name}
          onChange={(e) => updateCustomization({ name: e.target.value })}
          placeholder="Give your companion a name..."
          className="w-full px-4 py-2 bg-slate-700 text-slate-200 placeholder-slate-400 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Personality Selection */}
      <div>
        <label className="block text-sm font-medium text-slate-200 mb-3">
          Personality Trait *
        </label>
        <div className="grid gap-3 md:grid-cols-2">
          {personalityTraits.map((personality) => (
            <div
              key={personality.trait}
              onClick={() => updateCustomization({ personality })}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                customization.personality.trait === personality.trait
                  ? 'border-purple-500 bg-purple-500/20'
                  : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
              }`}
            >
              <div className="font-medium text-slate-200 mb-1">{personality.trait}</div>
              <div className="text-xs text-slate-400">{personality.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Identity Selection */}
      <div>
        <label className="block text-sm font-medium text-slate-200 mb-3">
          Character Identity *
        </label>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {characterIdentities.map((identity) => (
            <div
              key={identity.id}
              onClick={() => updateCustomization({ identity })}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all text-center ${
                customization.identity.id === identity.id
                  ? 'border-purple-500 bg-purple-500/20'
                  : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
              }`}
            >
              <div className="text-2xl mb-2">{identity.emoji}</div>
              <div className="font-medium text-slate-200 text-sm mb-1">{identity.name}</div>
              <div className="text-xs text-slate-400">{identity.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Guiding Style */}
      <div>
        <label className="block text-sm font-medium text-slate-200 mb-3">
          Guiding Style *
        </label>
        <div className="grid gap-3 md:grid-cols-2">
          {guidingStyles.map((style) => (
            <div
              key={style.id}
              onClick={() => updateCustomization({ guidingStyle: style })}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                customization.guidingStyle.id === style.id
                  ? 'border-purple-500 bg-purple-500/20'
                  : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
              }`}
            >
              <div className="font-medium text-slate-200 mb-1">{style.name}</div>
              <div className="text-xs text-slate-400 mb-2">{style.description}</div>
              <div className="text-xs text-slate-500">{style.approach}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Appearance and Additional Traits */}
      <div>
        <label className="block text-sm font-medium text-slate-200 mb-2">
          Appearance and Additional Traits (Optional)
        </label>
        <textarea
          value={customization.additionalTraits}
          onChange={(e) => updateCustomization({ additionalTraits: e.target.value })}
          placeholder="Describe your character's appearance, additional personality traits, speaking style, or any other characteristics you'd like them to have..."
          rows={4}
          className="w-full px-4 py-3 bg-slate-700 text-slate-200 placeholder-slate-400 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 resize-vertical"
        />
        <div className="text-xs text-slate-400 mt-2">
          This will be used directly in the character's prompt to define their appearance and additional traits.
        </div>
      </div>

      {/* Action Buttons */}
      <div className={`flex gap-3 pt-4 ${showCancelButton ? '' : 'justify-end'}`}>
        <button
          onClick={onSubmit}
          disabled={isGenerating || !customization.name.trim()}
          className={`${showCancelButton ? 'flex-1' : ''} px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all`}
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              {submitButtonText.includes('Save') ? 'Saving Changes...' : 'Generating Character...'}
            </span>
          ) : (
            submitButtonText
          )}
        </button>
        {showCancelButton && onCancel && (
          <button
            onClick={onCancel}
            disabled={isGenerating}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:cursor-not-allowed text-slate-300 rounded-lg transition-all duration-200 border border-slate-600"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
