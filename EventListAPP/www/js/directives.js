angular.module('SysTodoList.directives',[])
.directive('date-format', ['$filter',function($filter) {
    var dateFilter = $filter('date');
    return {
        require: 'ngModel',
        link: function(scope, elm, attrs, ctrl) {
            function formatter(value) {
                return dateFilter(value, 'yyyy-MM-dd hh:mm');
            }

            function parser() {
                return ctrl.$modelValue;
            }
            ctrl.$formatters.push(formatter);
            ctrl.$parsers.unshift(parser);
        }
    };
}]);