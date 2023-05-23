let cartaMia = 2
let carteGiu = [9, 6, 3, 10]

console.log(sumSubsets(cartaMia, carteGiu));
console.log()

function sumSubsets(target, numbers, subset = [], index = 0){

  var result = [];

  if(target === 0){
    return [subset];
  }

  for(let i = index; i < numbers.length; i++){
    if(numbers[i] > target) {
      continue;
    }

    var newSubset = subset.concat(numbers[i]);
    var newResult = sumSubsets(target - numbers[i], numbers, newSubset, i + 1);

    result = result.concat(newResult);
  }

  return result;
}