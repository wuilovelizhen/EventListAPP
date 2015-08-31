angular.module('SysTodoList.controllers', [
    'ionic',
    'ngCordova.plugins.dialogs',
    'ngCordova.plugins.toast',
    'ngCordova.plugins.appVersion',
    'ngCordova.plugins.file',
    'ngCordova.plugins.fileTransfer',
    'ngCordova.plugins.fileOpener2',
    'ngCordova.plugins.datePicker'
])

    .controller('LoadingCtrl', function($state, $timeout) {
        $timeout(function() {
            $state.go('login',{ 'CheckUpdate':'Y' }, { reload : true });
        }, 2500);
    })
    
    .controller('LoginCtrl', function($scope, $http, $state, $stateParams, $ionicPopup, $timeout, $ionicLoading, $cordovaToast, $cordovaAppVersion) {
        $scope.logininfo = {};
        if(undefined == $scope.logininfo.strPhoneNumber){
            $scope.logininfo.strPhoneNumber = "";
        } 
        $('#iPhoneNumber').on('keydown', function(e){
            if(e.which === 9 || e.which === 13) {
                $scope.login();
            }
        });
        if($stateParams.CheckUpdate === 'Y'){
            var url = strWebServiceURL +  strBaseUrl + '/update.json';
            $http.get(url)
                .success(function(res) {
                    var serverAppVersion = res.version;
                    $cordovaAppVersion.getVersionNumber().then(function (version) {
                        if (version != serverAppVersion) {
                            $state.go('update',{'Version':serverAppVersion});
                        }
                    });
                })
                .error(function (res) {
                    //
                });
        }
        $scope.setConf = function(){
            $state.go('setting',{ }, { reload:true });
        }
        
        $scope.login = function () {
            if(window.cordova && window.cordova.plugins.Keyboard) {
                cordova.plugins.Keyboard.close();
            }
            if($scope.logininfo.strPhoneNumber == ""){
                var alertPopup = $ionicPopup.alert({
                    title: 'Please Enter Phone Number.',
                    okType: 'button-assertive'
                });
                $timeout(function() {
                    alertPopup.close();
                }, 2500);
                return;
            }
            $ionicLoading.show();
            var jsonData = { "PhoneNumber":$scope.logininfo.strPhoneNumber};
            var strUri = "/api/event/action/list/login";
            var strKey = hex_md5(strBaseUrl + strUri + strSecretKey.replace(/-/ig,""));
            $http({
                method: 'POST',
                url:	strWebServiceURL + strBaseUrl + strUri,
                data:	jsonData,
                headers: {
                    "Signature": strKey
                }
            }).success(function (data) {
                $ionicLoading.hide();
                if (parseInt(data.meta.code) == 200) {
                    sessionStorage.clear();
                    sessionStorage.setItem("strPhoneNumber", $scope.logininfo.strPhoneNumber);
                    sessionStorage.setItem("strDriverName", data.data.results);                    
                    $state.go('main',{ 'blnForcedReturn':'N' },{ reload:true });                    
                } else {
                    var alertPopup = $ionicPopup.alert({
                        title: data.meta.message,
                        subTitle: data.meta.errors.message,
                        okType: 'button-assertive'
                    });
                    $timeout(function() {
                        alertPopup.close();
                    }, 2500);
                }
            }).error(function (data) {
				$ionicLoading.hide();
				var alertPopup = $ionicPopup.alert({
					title: 'Connect to WebService failed.',
					okType: 'button-assertive'
				});
				$timeout(function() {
					alertPopup.close();
				}, 2500);
            });
        };
    })
    
    .controller('SettingCtrl', function($scope, $state, $timeout, $ionicLoading, $ionicPopup, $cordovaToast, $cordovaFile) {
        $scope.Setting = {};
        $scope.Setting.WebServiceURL = strWebServiceURL.replace('http://','');
        $scope.Setting.BaseUrl = strBaseUrl.replace('/','');
        $scope.returnLogin = function () {
            $state.go('login', { 'CheckUpdate':'Y' }, {reload: true});
        };
        $scope.saveSetting = function(){
            if($scope.Setting.WebServiceURL.length>0){
                strWebServiceURL = $scope.Setting.WebServiceURL;
                if(strWebServiceURL.length>0){
                    strWebServiceURL = "http://" + strWebServiceURL;
                }
            }else{ $scope.Setting.WebServiceURL = strWebServiceURL }
            if($scope.Setting.BaseUrl.length>0){
                strBaseUrl = $scope.Setting.BaseUrl;
                if(strBaseUrl.length>0){
                    strBaseUrl = "/" + strBaseUrl;
                }
            }else{ $scope.Setting.BaseUrl = strBaseUrl }
            var data = 'BaseUrl=' + $scope.Setting.BaseUrl +'##WebServiceURL='+$scope.Setting.WebServiceURL;
            var path = cordova.file.externalRootDirectory;
            var directory = "TmsApp";
            var file = directory + "/Config.txt";
            $cordovaFile.writeFile(path, file, data, true)
                .then(function (success) {
                    $state.go('login', { 'CheckUpdate':'Y' }, {reload: true});
                }, function (error) {
                    $cordovaToast.showShortBottom(error);   
                });
        };        
        $scope.delSetting = function () {
            var path = cordova.file.externalRootDirectory;
            var directory = "TmsApp";
            var file = directory + "/Config.txt";
            $cordovaFile.removeFile(path, file)
                .then(function (success) {
                    var alertPopup = $ionicPopup.alert({
                        title: 'Delete Config File Success.',
                        okType: 'button-calm'
                    });
                    $timeout(function () {
                        alertPopup.close();
                    }, 2500);
                }, function (error) {
                    $cordovaToast.showShortBottom(error);
                });
        };
    })
    
    .controller('UpdateCtrl', function($scope, $stateParams, $state, $timeout, $ionicLoading, $cordovaToast, $cordovaFile, $cordovaFileTransfer, $cordovaFileOpener2) {
        $scope.strVersion = $stateParams.Version;
        $scope.returnLogin = function () {
            $state.go('login', { 'CheckUpdate':'N' }, {reload: true});
        };
        $scope.upgrade = function(){
            $ionicLoading.show({
                template: "Download  0%"
            });
            var url = strWebServiceURL + strBaseUrl + "/TMS.apk";
            var blnError = false;
            $cordovaFile.checkFile(cordova.file.externalRootDirectory, "TMS.apk")
            .then(function (success) {
                //
            }, function (error) {
                blnError = true;
            });
            var targetPath = cordova.file.externalRootDirectory + "TMS.apk";
            var trustHosts = true;
            var options = {};
            if(!blnError){
                $cordovaFileTransfer.download(url, targetPath, options, trustHosts).then(function (result) {
                    $ionicLoading.hide();   
                    $cordovaFileOpener2.open(targetPath, 'application/vnd.android.package-archive'
                    ).then(function () {
                            // success
                        }, function (err) {
                            // error
                        });
                }, function (err) {
                    $cordovaToast.showShortCenter('Download faild.'); 
                    $ionicLoading.hide();
                    $state.go('login', { 'CheckUpdate':'N' }, {reload: true});
                }, function (progress) {
                    $timeout(function () {
                        var downloadProgress = (progress.loaded / progress.total) * 100;
                        $ionicLoading.show({
                            template: "Download  " + Math.floor(downloadProgress) + "%"
                        });
                        if (downloadProgress > 99) {
                            $ionicLoading.hide();
                        }
                    })
                });
            }else{
                $ionicLoading.hide();
                $cordovaToast.showShortCenter('Check APK file faild.'); 
                $state.go('login', { 'CheckUpdate':'N' }, {reload: true});
            }
        };
    })  
    
    .controller('MainCtrl', function($scope, $http, $state, $stateParams, $ionicPopup, $timeout) {
		var strDriverName = sessionStorage.getItem("strDriverName");
		var strPhoneNumber = sessionStorage.getItem("strPhoneNumber");
		if (strDriverName === null || strDriverName === "") {
			$scope.strDriverName = "Driver";				
		} else {
			$scope.strDriverName = strDriverName;			
		}
        $scope.strItemsCount = "loading...";
        var strUri = "/api/event/action/list/jobno/";
		var strKey = hex_md5(strBaseUrl + strUri + strPhoneNumber + "?format=json" + strSecretKey.replace(/-/ig,""));
		$http({
			method: 'GET',
			url:    strWebServiceURL + strBaseUrl + strUri + strPhoneNumber + "?format=json",
			headers: {
				"Signature": strKey
			}
		}).success(function (data) {
			if (parseInt(data.meta.code) == 200) {
                if(data.data.results.length === 1 && $stateParams.blnForcedReturn === 'N'){
                    $state.go('list', { 'JobNo':data.data.results[0].JobNo }, {reload: true});
                }
                $scope.Jobs = data.data.results;
			}
		}).error(function (data) {
            //
		});
        $scope.showList = function (strJobNo) {
            $state.go('list', { 'JobNo':strJobNo }, {reload: true});
        };
    })

    .controller('ListCtrl', function($scope, $state, $stateParams, $http,  $ionicPopup, $timeout, $ionicLoading, $cordovaDialogs, $ionicActionSheet) {
        $scope.shouldShowDelete = false;
        $scope.listCanSwipe = true;
        $scope.JobNo = $stateParams.JobNo;
        var strPhoneNumber = sessionStorage.getItem("strPhoneNumber");
        var strJobNo = $scope.JobNo;
        var strUri = "/api/event/action/list/container/";
        var strKey = hex_md5(strBaseUrl + strUri + strPhoneNumber + "/" + strJobNo + "?format=json" + strSecretKey.replace(/-/ig,""));
        var getTasks = function(){
			$ionicLoading.show();
            getData();
        }		
        var getData = function(){
            $http({
                method: 'GET',
                url:    strWebServiceURL + strBaseUrl + strUri + strPhoneNumber + "/" + strJobNo + "?format=json",
                headers: {
                    "Signature": strKey
                }
            }).success(function (data) {
                $ionicLoading.hide();
                if (data.meta.code == 200) {                    
                    $scope.tasks = data.data.results;
                    if (data.data.results.length == 0) {
                        var alertPopup = $ionicPopup.alert({
                            title: 'No Tasks.',
                            okType: 'button-calm'
                        });
                        $timeout(function() {
                            alertPopup.close();
                        }, 2500);
                    }
                }
            }).error(function (data) {
				$ionicLoading.hide();
				var alertPopup = $ionicPopup.alert({
					title: 'Connect to WebService failed.',
					okType: 'button-assertive'
				});
				$timeout(function() {
					alertPopup.close();
				}, 2500);
            });
        }
        
        $scope.doRefresh = function() {
            $http({
                method: 'GET',
                url:    strWebServiceURL + strBaseUrl + strUri + strPhoneNumber + "/" + strJobNo + "?format=json",
                headers: {
                    "Signature": strKey
                }
            }).success(function (data) {
                if (data.meta.code == 200) {                    
                    $scope.tasks = data.data.results;
                    if (data.data.results.length == 0) {
                        var alertPopup = $ionicPopup.alert({
                            title: 'No Tasks.',
                            okType: 'button-calm'
                        });
                        $timeout(function() {
                            alertPopup.close();
                        }, 2500);
                    }
                }
            }).error(function (data) {
				$ionicLoading.hide();
				var alertPopup = $ionicPopup.alert({
					title: 'Connect to WebService failed.',
					okType: 'button-assertive'
				});
				$timeout(function() {
					alertPopup.close();
				}, 2500);
            }).finally(function() {
                $scope.$broadcast('scroll.refreshComplete');
            });
            $scope.$apply();
        };
        
        var setDoneFlag = function(JobNo,JobLineItemNo,LineItemNo,DoneDateTime,blnRefresh){
			$ionicLoading.show();
            var jsonData = { "JobNo":JobNo,"JobLineItemNo":JobLineItemNo,"LineItemNo":LineItemNo,"DoneFlag":"Y","DoneDatetime":DoneDateTime,"Remark":''};
            var strUri = "/api/event/action/update/done";
            var strKey = hex_md5(strBaseUrl + strUri + strSecretKey.replace(/-/ig,""));
            $http({
                method: 'POST',
                url:    strWebServiceURL + strBaseUrl + strUri,
                data:   jsonData,
                headers: {
                    "Signature": strKey
                }
            }).success(function (data) {
                if (data.meta.code == 200) {
                    if(blnRefresh){
                        getTasks();
                    }
                } else {
                    $ionicLoading.hide();
					var alertPopup = $ionicPopup.alert({
						title: 'Update Event Status Failed.',
						okType: 'button-assertive'
					});
					$timeout(function() {
						alertPopup.close();
					}, 2500);
                }
            }).error(function (data) {
                $ionicLoading.hide();
				var alertPopup = $ionicPopup.alert({
					title: 'Connect to WebService failed.',
					okType: 'button-assertive'
				});
				$timeout(function() {
					alertPopup.close();
				}, 2500);
            });
        }

        $scope.returnMain = function () {
            $state.go('main', { 'blnForcedReturn':'Y' }, {reload: true});
        };
		     
        $scope.slideDone = function (task) {
            //
            $state.go('detail',{'ContainerNo':task.ContainerNo,'JobNo':task.JobNo,'JobLineItemNo':task.JobLineItemNo,'LineItemNo':task.LineItemNo,'Description':task.Description,'Remark':task.Remark});
            /*
            $scope.Update = {};
            var myDate = new Date();
            $scope.Update.date = myDate;
            $scope.Update.time = myDate;
            var myPopup = $ionicPopup.show({
                template: 'Date:<input type="date" ng-model="Update.date">Time:<input type="time" ng-model="Update.time">',
                title: '<h4>Task<br/>"' + task.Description + '"<br/>Completed ?</h4>',
                subTitle: 'Please chose complete datetime.',
                scope: $scope,
                buttons: [
                  {
                    text: 'Done',
                    type: 'button-positive',
                    onTap: function(e) {
                        myDate.setFullYear($scope.Update.date.getFullYear());
                        myDate.setMonth($scope.Update.date.getMonth());
                        myDate.setDate($scope.Update.date.getDate());
                        myDate.setHours($scope.Update.time.getHours());
                        myDate.setMinutes($scope.Update.time.getMinutes());
                        setDoneFlag(task.JobNo, task.JobLineItemNo, task.LineItemNo, myDate, false);
                        $scope.tasks.splice($scope.tasks.indexOf(task), 1);
                        if($scope.tasks.length<1){
                            var alertPopup = $ionicPopup.alert({
                                title: 'No Tasks.',
                                okType: 'button-calm'
                            });
                            $timeout(function() {
                                alertPopup.close();
                            }, 2500);
                        }
                        myPopup.close();
                    }
                  },
                  { text: 'Cancel' }
                ]
            });
            $timeout(function() {
                myPopup.close();
            }, 15000);
            
            var hideSheet = $ionicActionSheet.show({
                titleText: ' <H4>Task "' + task.Description + '" Completed ?</H4>',
                destructiveText: '<i class="icon ion-android-done calm"></i>  Done',
                cancelText: '<i class="icon ion-android-cancel balanced"></i>  Cancel',
                cancel: function () {
                    hideSheet();
                },
                destructiveButtonClicked: function ()
                {
                    //setDoneFlag(task.JobNo, task.JobLineItemNo, task.LineItemNo, false);
                    //$scope.tasks.splice($scope.tasks.indexOf(task), 1);
                    //hideSheet();
                    /*
                    if($scope.tasks.length<1){
                        var alertPopup = $ionicPopup.alert({
                            title: 'No Tasks.',
                            okType: 'button-calm'
                        });
                        $timeout(function() {
                            alertPopup.close();
                        }, 2500);
                    }
                }
            });
            $timeout(function() {
                hideSheet();
            }, 4500);
            */
        };
        
        $scope.showDetail = function(task){
            var JobNoContainerNo = 
            navigator.notification.confirm('Task "' + task.Description + '" Completed ?', function(buttonIndex){
                if(buttonIndex == 1){
                    setDoneFlag(task.JobNo, task.JobLineItemNo, task.LineItemNo, new Date(), true);
                }
            }, task.ContainerNo, ['Done','Cancel']);
        };

        var intJobLineItemNo = -1;
        $scope.checkEventOrder = function (task) {
            if (intJobLineItemNo != task.JobLineItemNo) {
                intJobLineItemNo = task.JobLineItemNo;
                return false;
            } else {
                return true;
            }
            //$scope.tasks
            /*
            var alertPopup = $ionicPopup.alert({
                title: 'Update Event Status Failed.',
                okType: 'button-assertive'
            });
            */
        };

        getTasks();
    })
    
    .controller('DetailCtrl', function($scope, $stateParams, $state, $http, $ionicLoading, $cordovaDatePicker) {
        $scope.strContainerNo = $stateParams.ContainerNo;
        $scope.strJobNo = $stateParams.JobNo;
        $scope.strJobLineItemNo = $stateParams.JobLineItemNo;
        $scope.strLineItemNo = $stateParams.LineItemNo;
        $scope.strDescription = $stateParams.Description;
        $scope.Update = {};
        $scope.Update.remark = $stateParams.Remark; 
        var currentDate = new Date();
        $scope.Update.datetime = currentDate;            
        $scope.returnList = function () {
            $state.go('list', { 'JobNo':$scope.strJobNo }, {reload: true});
        };
        
        $scope.update = function(){          
			$ionicLoading.show();
            currentDate.setFullYear($scope.Update.datetime.getFullYear());
            currentDate.setMonth($scope.Update.datetime.getMonth());
            currentDate.setDate($scope.Update.datetime.getDate());
            currentDate.setHours($scope.Update.datetime.getHours());
            currentDate.setMinutes($scope.Update.datetime.getMinutes());
            var jsonData = { "JobNo":$scope.strJobNo,"JobLineItemNo":$scope.strJobLineItemNo,"LineItemNo":$scope.strLineItemNo,"DoneFlag":"Y","DoneDatetime":currentDate,"Remark":$scope.Update.remark};
            var strUri = "/api/event/action/update/done";
            var strKey = hex_md5(strBaseUrl + strUri + strSecretKey.replace(/-/ig,""));
            $http({
                method: 'POST',
                url:    strWebServiceURL + strBaseUrl + strUri,
                data:   jsonData,
                headers: {
                    "Signature": strKey
                }
            }).success(function (data) {
                if (data.meta.code == 200) {
                    $ionicLoading.hide();
                    $state.go('list', { 'JobNo':$scope.strJobNo }, {reload: true});
                } else {                    
                    $ionicLoading.hide();
					var alertPopup = $ionicPopup.alert({
						title: 'Update Event Status Failed.',
						okType: 'button-assertive'
					}); 
					$timeout(function() {
						alertPopup.close();
                        $state.go('list', { 'JobNo':$scope.strJobNo }, {reload: true});
					}, 2500);
                }
            }).error(function (data) {                
                $ionicLoading.hide();
				var alertPopup = $ionicPopup.alert({
					title: 'Connect to WebService failed.',
					okType: 'button-assertive'
				});
				$timeout(function() {
					alertPopup.close();                    
                    $state.go('list', { 'JobNo':$scope.strJobNo }, {reload: true});
				}, 2500);
            });
        };
        /*
        $scope.pickDate = function () {
            var options = {
                date: new Date(),
                mode: 'date', // or 'time'
                minDate: new Date() - 10000,
                allowOldDates: true,
                allowFutureDates: false,
                doneButtonLabel: 'DONE',
                doneButtonColor: '#F2F3F4',
                cancelButtonLabel: 'CANCEL',
                cancelButtonColor: '#000000'
            };
            $cordovaDatePicker.show(options).then(function(date){
                alert(date);
            });
        };
        */
    })