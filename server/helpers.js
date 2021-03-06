const { parse, combine } = require('recipe-ingredient-parser');
const convert = require('convert-units');
const pluralize = require('pluralize');

const units = {
  teaspoon: 'tsp',
  tablespoon: 'Tbs',
  'fluid ounce': 'fl-oz',
  cup: 'cup',
  pint: 'pnt',
  quart: 'qt',
  gallon: 'gal',
  milliliter: 'ml',
  liter: 'l',
  kiloliter: 'kl',
  ounce: 'oz',
  pound: 'lb',
  gram: 'g',
  kilogram: 'kg'
};
  
const unitsList = ['tsp', 'Tbs', 'fl-oz', 'cup', 'pnt', 'qt', 'gal', 'l', 'ml', 'kl', 'oz', 'lb', 'g', 'kg'];
  
// Takes in array of strings
const parseIngredients = (ingredients) => {
  let parsed = ingredients.map(ingredient => {
    // Create object using 'recipe ingredient parser' module
    let obj = parse(ingredient.toLowerCase());
    // Convert to singular
    obj.ingredient = pluralize.singular(obj.ingredient);
    if (obj.unit) {
      obj.unit = pluralize.singular(obj.unit);
      // Convert to abbreviation
      if (units[obj.unit]) {
        obj.unit = units[obj.unit];
      } else {
        obj.unit = null;
      }
    }
    return obj;
  });
  return parsed;
}

const formatIngredients = (ingredientsObj) => {
  ingredients = [];
  ingredientsObj.forEach((ingredient) => {
    ingredients.push(`${ingredient.amount} ${ingredient.unit} ${ingredient.name}`);
  });
  return parseIngredients(ingredients);
}

const compareIngredients = (recipe, ingredients) => {
  recipe.forEach(ingredient => {
    ingredient.quantity *= -1;
  });
  return combineIngredients(recipe, ingredients);
}

const compareIngredientsKeepBoth = (recipe, ingredients) => {
  ingredients.forEach(ingredient => {
    ingredient.quantity *= -1;
  });
  return combineIngredientsKeepBoth(recipe, ingredients);
}
  // Takes in two arrays of objects with quantity, unit, and ingredient properties
const combineIngredients = (ingredients, oldIngredients) => {
  // Converts the old ingredients array into an object
  let ingredientsObj = {};
  oldIngredients.forEach(ingredient => {
    ingredientsObj[ingredient.ingredient] = { quantity: ingredient.quantity, unit: ingredient.unit, imageurl: ingredient.imageurl }
  });
  // Compares elements from the new ingredients array to old ingredients and converts as necessary
  let results = [];
  ingredients.forEach(newIngredient => {
    let old = ingredientsObj[newIngredient.ingredient];
    if (old && unitsList.includes(old.unit) && unitsList.includes(newIngredient.unit)) {
      try {
        newIngredient.quantity = convert(newIngredient.quantity).from(newIngredient.unit).to(old.unit);
      } catch(err) {
        // console.error('NEW ONE', err);
        throw (`Cannot convert ${newIngredient.unit} to ${old.unit} for ${newIngredient.ingredient}`);
      }
      newIngredient.unit = old.unit;
      let combinedWithUnits = combine([newIngredient, { quantity: old.quantity, unit: old.unit, ingredient: newIngredient.ingredient, imageurl: newIngredient.imageurl }]);
      results.push(combinedWithUnits[0]);
    } else if (old && !old.unit && !newIngredient.unit) {
      let combinedWithoutUnits = combine([newIngredient, { quantity: old.quantity, unit: null, ingredient: newIngredient.ingredient, imageurl: newIngredient.imageurl }]);
      results.push(combinedWithoutUnits[0]);
    } else {
      results.push(newIngredient);
    }
  });
  return results;
};

  // Takes in two arrays of objects with quantity, unit, and ingredient properties
const combineIngredientsKeepBoth = (ingredients, oldIngredients) => {
  let combinedIngredients
  try {
    combinedIngredients = combineIngredients(ingredients, oldIngredients);
  } catch(err) {
    console.error('ERROR combining');
    throw err;
  }
  let filteredOldIngredients = oldIngredients.filter((oldIngredient) => {
    if (oldIngredient.ispurchased) {
      for (let combinedIngredient of combinedIngredients) {
        if (oldIngredient.ingredient === combinedIngredient.ingredient) {
          return false;
        }
      }
      return true
    }
  })
  try {
    return combinedIngredients.concat(filteredOldIngredients);
  } catch(err) {
    console.error('CONCAT', err);
    throw err;
  }
};
//====================================================
module.exports = {
  parseIngredients,
  compareIngredients,
  compareIngredients,
  compareIngredientsKeepBoth,
  combineIngredients,
  combineIngredientsKeepBoth,
  formatIngredients,
  convert,
  combine,
  pluralize
};