import React, { useState } from 'react';
import { Text, TouchableOpacity } from 'react-native';

/**
 * Composant pour afficher du texte avec option "Voir plus/Voir moins"
 * Cliquer sur le texte pour expand/collapse
 */
export default function ExpandableText({ 
  text, 
  numberOfLines = 3, 
  style = {},
  expandedStyle = {}
}) {
  const [expanded, setExpanded] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [measured, setMeasured] = useState(false);

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  const onTextLayout = (e) => {
    // Ne mesurer qu'une seule fois pour éviter les boucles infinies
    if (!measured && e.nativeEvent && e.nativeEvent.lines) {
      setMeasured(true);
      const lineCount = e.nativeEvent.lines.length;
      // Vérifier si le texte dépasse le nombre de lignes
      if (lineCount >= numberOfLines) {
        setShowButton(true);
      }
    }
  };

  if (!text) return null;

  return (
    <TouchableOpacity 
      onPress={showButton ? toggleExpanded : undefined}
      activeOpacity={showButton ? 0.7 : 1}
      disabled={!showButton}
    >
      <Text
        style={expanded ? expandedStyle : style}
        numberOfLines={expanded ? undefined : numberOfLines}
        ellipsizeMode="tail"
        onTextLayout={onTextLayout}
      >
        {text}
      </Text>
    </TouchableOpacity>
  );
}
