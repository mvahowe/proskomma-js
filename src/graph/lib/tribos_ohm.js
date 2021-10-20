/*
predicateExpression {
  Exp
    = booleanExpression

  booleanExpression =
    "true" |
    "false" |
    booleanNonPrimitive

  booleanNonPrimitive =
    equalsOperator |
    notEqualOperator |
    andOperator |
    orOperator

  equalsOperator = "==" "(" expressions ")"
  notEqualOperator = "!=" "(" expressions ")"
  andOperator = "and" "(" booleanExpressions ")"
  orOperator = "or" "(" booleanExpressions ")"

  expressions = expression ("," " "* expressions)*
  booleanExpressions = booleanExpression ("," " "* booleanExpressions)*
  stringExpressions = stringExpression ("," " "* stringExpressions)*

  expression = booleanExpression | stringExpression

  stringExpression = stringLiteral | stringNonPrimitive

  stringNonPrimitive = concatOperator

  concatOperator =  "concat" "(" stringExpressions ")"

  stringLiteral = "'" letter* "'"

}
*/
