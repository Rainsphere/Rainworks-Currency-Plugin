/*:
 * @plugindesc Add currency management to your game. [v1.00]
 * @author Rainworks Plugins
 *
 * @help
 * ============================================================================
 * Introduction
 * ============================================================================
 * This plugin places a currency management system into your RPG Maker MV game.
 * You set up categories and currencies through the plugin menu, assigning
 * a category to your currency for easy sorting.
 * You can then increase/decrease or otherwise manipulate the currencies using
 * plugin commands.
 *
 * ============================================================================
 * Parameters
 * ============================================================================
 * ----------------------------------------------------------------------------
 * Currency Categories
 * ----------------------------------------------------------------------------
 *
 * Description
 * ----------------
 * Categories and their respective currencies
 *
 * Fields
 * ----------------
 *
 *    Title       - The title of the Category
 *    Shows Gold  - Whether or not this category displays the built-in currency
 *    Is Visible  - Whether to display this category in the menu or not
 *
 * ----------------------------------------------------------------------------
 * Currency
 * ----------------------------------------------------------------------------
 *
 * Description
 * ----------------
 *    Currencies
 *
 * Fields
 * ----------------
 *
 * Currency Name  - The name of the currency
 * Currency Cap   - The max number of this currency a player can carry.
 * Is Visible     - Whether this currency is visible in the currency list
 * Category       - The id of the category that this currency belongs
 *
 * ----------------------------------------------------------------------------
 * Max Category Row Count
 * ----------------------------------------------------------------------------
 *
 * Description
 * ----------------
 * The maximum number of initially visible rows for the categories list
 *
 * The categories list will automatically grow based on the number of
 * categories you have.  There are 3 categories per row. Set this higher if you
 * would like the categories list to display more in the initial list
 * without scrolling.
 * Default: 3
 *
 * ============================================================================
 * Plugin Commands
 * ============================================================================
 * Currency Hide Category x
 *  - Hide the category from the menu list by the category id x
 *
 * Currency Show Category x
 *  - Show the category in the menu list by the category id x
 *
 * Currency Hide Currency x
 *  - Hide the currency from the menu list by the currency id x
 *
 * Currency Show Currency x
 *  - Show the currency in the menu list by the currency id x
 *
 * Currency Add x To Currency y
 *  - Add x number of currency to the currency id y
 *
 * Currency Remove x From Currency y
 *  - Remove x number of currency from the currency id y
 *
 * OpenCurrency
 *  - Open the currency menu
 *
 * ============================================================================
 * Text Codes
 * ============================================================================
 * \currency[x]
 *  - Displays the name of the currency with id x.  You can use item icon codes
 *    in the name of a currency and those are displayed as well.
 *
 * \currencyAmount[x]
 *  - Displays the current amount of currency with id x held by the player
 *
 * \currencyCap[x]
 *  - Displays the currency cap for the currency with id x
 *
 * \currencyAmountAndCap[x]
 *  - Displays the currency amount and cap for the currency at id x
 *    If the cap is zero, just the amount is shown
 *
 * ============================================================================
 * Conditional Loop Event Functions
 * ============================================================================
 * $gameSystem.RainworksGetCurrencyAmount(x)
 *  - Where x is the id of the currency you are checking
 *  - Usage:
 *    You can use this function to check your mathematical relations.
 *    For Example:
 *    (Is Greater Than)
 *    $gameSystem.RainworksGetCurrencyAmount(x) > 2000
 *    (Is Greater Than or Equal To)
 *    $gameSystem.RainworksGetCurrencyAmount(x) >= 2000
 *    (Is Equal To)
 *    $gameSystem.RainworksGetCurrencyAmount(x) == 2000
 *    (Is Not Equal To)
 *    $gameSystem.RainworksGetCurrencyAmount(x) != 2000
 *
 *  $gameSystem.RainworksCurrencyIsCategoryVisible(x)
 *   - Check if x Category is visible.  If visible returns true.  If hidden
 *     returns false.
 *
 *  $gameSystem.RainworksCurrencyIsCurrencyVisible(x)
 *   - Check if x Currency is visible.  If visible returns true.  If hidden
 *     returns false.
 *
 * ============================================================================
 * Version History
 * ============================================================================
 *
 * Version 1.00 - Initial Version
 *
 * -
 * -
 * @param Currency Categories
 * @type struct<Categories>[]
 * @desc Categories and their respective currencies
 * @default ["{\"Title\":\"Common\",\"Shows Gold\":\"false\",\"Is Visible\":\"true\"}"]
 *
 * @param Currency
 * @type struct<Currency>[]
 * @desc Currencies
 * @default ["{\"Currency Name\":\"Token\",\"Currency Cap\":\"0\",\"Is Visible\":\"true\",\"Category\":\"1\"}"]
 *
 * @param Max Category Row Count
 * @type number
 * @desc The maximum number of initially visible rows for the categories list
 * @default 3
 */
/*~struct~Categories:
 * @param Title
 * @desc The title of the Category.
 * @default General
 *
 * @param Shows Gold
 * @desc Should this category show the built-in currency?
 * @type boolean
 * @default false
 *
 * @param Is Visible
 * @type boolean
 * @desc Is this category visible in the menu?
 * @on Yes
 * @off No
 * @default true
 */
/*~struct~Currency:
 * @param Currency Name
 * @desc Name of the Currency.
 * @default Currency Name
 *
 * @param Currency Cap
 * @desc Used to set the limit on the number of this currency a player can carry.  Set to 0 for unlimited.
 * @type number
 * @default 0
 *
 * @param Is Visible
 * @type boolean
 * @desc Is this currency visible in the menu?
 * @on Yes
 * @off No
 * @default true
 *
 * @param Category
 * @type number
 * @desc The category id number for this currency
 * @default 1
 */
(function() {
  var Rainworks = Rainworks || {};
  Rainworks.Currency = Rainworks.Currency || {};
  Rainworks.Currency.version = 1.0;

  Rainworks.Parameters = PluginManager.parameters('Rainworks_Currency');
  Rainworks.Param = Rainworks.Param || {};
  Rainworks.Param.Categories = JSON.parse(Rainworks.Parameters['Currency Categories']);
  Rainworks.Param.Currency = JSON.parse(Rainworks.Parameters['Currency']);

  //=============================================================================
  // DataManager
  //=============================================================================
  var $dataRainworksCurrency = [];
  var $dataRainworksCategories = [];

  DataManager.currencyDatabaseCreate = function() {
    $dataRainworksCurrency = [];
    $dataRainworksCategories = [];

    var categories = Rainworks.Param.Categories || null;
    var currencies = Rainworks.Param.Currency || null;

    if (categories) {
      var self = this;
      categories.forEach(function(category, index) {
        self.categoryDatabaseAdd(category, index);
      });
    }

    if (currencies) {
      var self = this;
      currencies.forEach(function(item, index) {
        self.currencyDatabaseAdd(item, index);
      });
    }
  };
  DataManager.categoryDatabaseAdd = function(category, index) {
    if (!category) return;
    var category = JSON.parse(category);

    var title = category['Title'];
    var showsGold = category['Shows Gold'] === 'true' ? true : false;
    var isVisible = category['Is Visible'] === 'true' ? true : false;

    var thisData = [];
    thisData['id'] = index;
    thisData['title'] = title;
    thisData['showsGold'] = showsGold;
    thisData['isVisible'] = isVisible;

    $dataRainworksCategories.push(thisData);
  };

  DataManager.currencyDatabaseAdd = function(currency, index) {
    if (!currency) return;
    var currency = JSON.parse(currency);

    var name = currency['Currency Name'];
    var cap = parseInt(currency['Currency Cap']);
    var isVisible = currency['Is Visible'] === 'true' ? true : false;
    var category = parseInt(currency['Category']);

    var thisData = [];
    thisData['id'] = index;
    thisData['name'] = name;
    thisData['cap'] = cap;
    thisData['isVisible'] = isVisible;
    thisData['category'] = category;

    $dataRainworksCurrency.push(thisData);
  };

  DataManager.currencyDatabaseCreate();

  //=============================================================================
  // Game_System
  //=============================================================================
  Rainworks.Currency.Game_System_initialize = Game_System.prototype.initialize;
  Game_System.prototype.initialize = function() {
    console.log('Game_System initializing');
    Rainworks.Currency.Game_System_initialize.call(this);
    this.initCurrencySettings();
  };
  Game_System.prototype.initCurrencySettings = function() {
    this._userCurrencyAmounts = this._userCurrencyAmounts || [];
    this._userVisibleCurrencies = this._userVisibleCurrencies || [];
    this._userHiddenCurrencies = this._userHiddenCurrencies || [];
    this._userVisibleCategories = this._userVisibleCategories || [];
    this._userHiddenCategories = this._userHiddenCategories || [];
  };
  Game_System.prototype.getUserCurrencyAmount = function(currencyId) {
    return this._userCurrencyAmounts[currencyId];
  };

  Game_System.prototype.addCurrency = function(currencyId, currencyAmount) {
    console.log(currencyId, currencyAmount);
    this.initCurrencySettings();
    var cap = parseInt($dataRainworksCurrency[currencyId]['cap']);
    if (this._userCurrencyAmounts[currencyId]) this._userCurrencyAmounts[currencyId] += currencyAmount;
    else this._userCurrencyAmounts[currencyId] = currencyAmount;

    if (cap !== 0 && this._userCurrencyAmounts[currencyId] > cap) this._userCurrencyAmounts[currencyId] = cap;
  };
  Game_System.prototype.removeCurrency = function(currencyId, currencyAmount) {
    this.initCurrencySettings();
    if (this._userCurrencyAmounts[currencyId] && this._userCurrencyAmounts[currencyId] >= currencyAmount)
      this._userCurrencyAmounts[currencyId] -= currencyAmount;
    else this._userCurrencyAmounts[currencyId] = 0;
  };
  Game_System.prototype.ShowCategory = function(categoryId) {
    this.initCurrencySettings();
    this._userVisibleCategories[categoryId] = categoryId;
    this._userHiddenCategories.splice(categoryId, 1);
  };
  Game_System.prototype.HideCategory = function(categoryId) {
    this.initCurrencySettings();
    this._userHiddenCategories[categoryId] = categoryId;
    this._userVisibleCategories.splice(categoryId, 1);
  };

  Game_System.prototype.ShowCurrency = function(currencyId) {
    this.initCurrencySettings();
    this._userVisibleCurrencies[currencyId] = currencyId;
    this._userHiddenCurrencies.splice(currencyId, 1);
  };

  Game_System.prototype.HideCurrency = function(currencyId) {
    this.initCurrencySettings();
    this._userHiddenCurrencies[currencyId] = currencyId;
    this._userVisibleCurrencies.splice(currencyId, 1);
  };

  Game_System.prototype.RainworksGetCurrencyAmount = function(currencyId) {
    currencyId = currencyId - 1;
    this.initCurrencySettings();
    var amount = this._userCurrencyAmounts[currencyId] ? parseInt(this._userCurrencyAmounts[currencyId]) : 0;
    return amount;
  };

  Game_System.prototype.RainworksGetCurrencyCap = function(currencyId) {
    currencyId = currencyId - 1;
    var cap = $dataRainworksCurrency[currencyId]['cap'];

    return cap;
  };
  Game_System.prototype.RainworksGetCurrencyName = function(currencyId) {
    currencyId = currencyId - 1;
    var name = $dataRainworksCurrency[currencyId]['name'];
    name = Window_Base.prototype.convertEscapeCharacters(name);

    return name;
  };

  Game_System.prototype.RainworksGetVisibleCategories = function() {
    this.initCurrencySettings();
    var returnData = [];
    var self = this;
    $dataRainworksCategories.forEach(function(category) {
      if (self._userVisibleCategories.contains(category['id'])) {
        returnData.push(category);
      } else if (category['isVisible'] && !self._userHiddenCategories.contains(category['id'])) {
        returnData.push(category);
      }
    });

    return returnData;
  };

  Game_System.prototype.RainworksGetVisibleCurrencies = function() {
    this.initCurrencySettings();
    var self = this;
    var returnData = [];
    $dataRainworksCurrency.forEach(function(currency) {
      if (self._userVisibleCurrencies.contains(currency['id'])) {
        returnData.push(currency);
      } else if (currency['isVisible'] && !self._userHiddenCurrencies.contains(currency['id'])) {
        returnData.push(currency);
      }
    });

    return returnData;
  };

  Game_System.prototype.RainworksCurrencyIsCategoryVisible = function(categoryId) {
    var visibleCategories = this.RainworksGetVisibleCategories();
    var hasCategory = visibleCategories.filter(function(category) {
      return category['id'] == categoryId - 1;
    });
    if (hasCategory.length !== 0) return true;
    else return false;
  };

  Game_System.prototype.RainworksCurrencyIsCurrencyVisible = function(currencyId) {
    var visibleCurrencies = this.RainworksGetVisibleCurrencies();
    var hasCurrency = visibleCurrencies.filter(function(currency) {
      return currency['id'] == currencyId - 1;
    });
    if (hasCurrency.length !== 0) return true;
    else return false;
  };

  Game_System.prototype.RainworksGetVisibleCurrencyByCategory = function(category) {
    this.initCurrencySettings();
    var currByCat = [];
    $dataRainworksCurrency.forEach(function(currency) {
      if (currency['category'] === parseInt(category) + 1) {
        currByCat.push(currency);
      }
    });
    var self = this;
    var returnData = [];
    currByCat.forEach(function(currency) {
      if (self._userVisibleCurrencies.contains(currency['id'])) {
        returnData.push(currency);
      } else if (currency['isVisible'] && !self._userHiddenCurrencies.contains(currency['id'])) {
        returnData.push(currency);
      }
    });

    return returnData;
  };
  //=============================================================================
  // Game_Interpreter
  //=============================================================================
  Rainworks.Currency.Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
  Game_Interpreter.prototype.pluginCommand = function(command, args) {
    Rainworks.Currency.Game_Interpreter_pluginCommand.call(this, command, args);
    if (command === 'OpenCurrency') {
      SceneManager.push(Scene_Currency);
    } else if (command === 'Currency') {
      this.processCurrencyPluginCommands(this.argsToString(args));
    }
  };
  Game_Interpreter.prototype.argsToString = function(args) {
    var str = '';
    var length = args.length;
    for (var i = 0; i < length; ++i) {
      str += args[i] + ' ';
    }
    return str.trim();
  };
  Game_Interpreter.prototype.processCurrencyPluginCommands = function(line) {
    if (line.match(/ADD[ ](\d+)[ ]TO CURRENCY[ ](\d+)/i)) {
      var currencyAmount = parseInt(RegExp.$1);
      var currencyId = parseInt(RegExp.$2) - 1;
      $gameSystem.addCurrency(currencyId, currencyAmount);
    } else if (line.match(/REMOVE[ ](\d+)[ ]FROM CURRENCY[ ](\d+)/i)) {
      var currencyAmount = parseInt(RegExp.$1);
      var currencyId = parseInt(RegExp.$2) - 1;
      $gameSystem.removeCurrency(currencyId, currencyAmount);
    } else if (line.match(/SHOW CATEGORY[ ](\d+)/i)) {
      var categoryId = parseInt(RegExp.$1) - 1;
      $gameSystem.ShowCategory(categoryId);
    } else if (line.match(/HIDE CATEGORY[ ](\d+)/i)) {
      var categoryId = parseInt(RegExp.$1) - 1;
      $gameSystem.HideCategory(categoryId);
    } else if (line.match(/SHOW CURRENCY[ ](\d+)/i)) {
      var currencyId = parseInt(RegExp.$1) - 1;
      $gameSystem.ShowCurrency(currencyId);
    } else if (line.match(/HIDE CURRENCY[ ](\d+)/i)) {
      var currencyId = parseInt(RegExp.$1) - 1;
      $gameSystem.HideCurrency(currencyId);
    }
  };
  //=============================================================================
  // Window_MenuCommand
  //=============================================================================
  Rainworks.Currency.Window_MenuCommand_addOriginalCommands = Window_MenuCommand.prototype.addOriginalCommands;
  Window_MenuCommand.prototype.addOriginalCommands = function() {
    Rainworks.Currency.Window_MenuCommand_addOriginalCommands.call(this);
    var text = 'Currency';
    this.addCommand(text, 'currency', true);
  };
  //=============================================================================
  // Window_Base
  //=============================================================================
  Rainworks.Currency.Window_Base_convertEscapeCharacters = Window_Base.prototype.convertEscapeCharacters;
  Window_Base.prototype.convertEscapeCharacters = function(text) {
    text = Rainworks.Currency.Window_Base_convertEscapeCharacters.call(this, text);
    text = text.replace(
      /\x1bCURRENCY\[(\d+)\]/gi,
      function() {
        return $gameSystem.RainworksGetCurrencyName(arguments[1]);
      }.bind(this)
    );
    text = text.replace(
      /\x1bCURRENCYAMOUNT\[(\d+)\]/gi,
      function() {
        return $gameSystem.RainworksGetCurrencyAmount(arguments[1]);
      }.bind(this)
    );
    text = text.replace(
      /\x1bCURRENCYCAP\[(\d+)\]/gi,
      function() {
        return $gameSystem.RainworksGetCurrencyCap(arguments[1]);
      }.bind(this)
    );
    text = text.replace(
      /\x1bCURRENCYAMOUNTWITHCAP\[(\d+)\]/gi,
      function() {
        var cap = $gameSystem.RainworksGetCurrencyCap(arguments[1]);
        if (cap == 0) {
          return $gameSystem.RainworksGetCurrencyAmount(arguments[1]);
        } else {
          return (
            $gameSystem.RainworksGetCurrencyAmount(arguments[1]) +
            '/' +
            $gameSystem.RainworksGetCurrencyCap(arguments[1])
          );
        }
      }.bind(this)
    );
    return text;
  };
  //=============================================================================
  // Window_Currency_Index
  //=============================================================================
  function Window_Currency_Index() {
    this.initialize.apply(this, arguments);
  }
  Window_Currency_Index.lastTopRow = 0;
  Window_Currency_Index.lastIndex = 0;
  Window_Currency_Index.prototype = Object.create(Window_Command.prototype);
  Window_Currency_Index.prototype.constructor = Window_Currency_Index;
  Window_Currency_Index.prototype.initialize = function() {
    Window_Command.prototype.initialize.call(this, 0, 0);
    this.refresh();
    this.setTopRow(Window_Currency_Index.lastTopRow);
    this.select(Window_Currency_Index.lastIndex);
  };

  Window_Currency_Index.prototype.windowWidth = function() {
    return Graphics.boxWidth;
  };

  Window_Currency_Index.prototype.windowHeight = function() {
    var visibleCategories = $gameSystem.RainworksGetVisibleCategories();
    var length = visibleCategories.length;
    var count = Math.ceil(length / 3);
    if (count > parseInt(Rainworks.Parameters['Max Category Row Count']))
      count = parseInt(Rainworks.Parameters['Max Category Row Count']);

    return this.fittingHeight(count);
  };

  Window_Currency_Index.prototype.setListWindow = function(listWindow) {
    this._listWindow = listWindow;
    this.updateList();
  };

  Window_Currency_Index.prototype.update = function() {
    Window_Command.prototype.update.call(this);
    this.updateList();
  };

  Window_Currency_Index.prototype.updateList = function() {
    if (this._listWindow) {
      var category = this._categoryList[this.index()];

      this._listWindow.setCategory(category['id']);
    }
  };

  Window_Currency_Index.prototype.maxCols = function() {
    return 3;
  };
  Window_Currency_Index.prototype.maxItems = function() {
    return this._categoryList ? this._categoryList.length : 0;
  };
  Window_Currency_Index.prototype.refresh = function() {
    Window_Command.prototype.refresh.call(this);
    this._categoryList = $gameSystem.RainworksGetVisibleCategories();
    this.createContents();
    this.drawAllItems();
  };

  Window_Currency_Index.prototype.drawItem = function(index) {
    var rect = this.itemRectForText(index);
    this.drawTextEx(this._categoryList[index]['title'], rect.x, rect.y);
  };

  Window_Currency_Index.prototype.processCancel = function() {
    Window_Command.prototype.processCancel.call(this);
    Window_Currency_Index.lastTopRow = this.topRow();
    Window_Currency_Index.lastIndex = this.index();
  };

  Window_Currency_Index.prototype.makeCommandList = function() {
    this._categoryList = $gameSystem.RainworksGetVisibleCategories();

    var self = this;
    this._categoryList.forEach(function(item) {
      self.addCommand(item['title'], 'index_select');
    });
  };
  //=============================================================================
  // Window_Currency_List
  //=============================================================================
  function Window_Currency_List() {
    this.initialize.apply(this, arguments);
  }

  Window_Currency_List.lastTopRow = 0;
  Window_Currency_List.lastIndex = 0;
  Window_Currency_List.prototype = Object.create(Window_Selectable.prototype);
  Window_Currency_List.prototype.constructor = Window_Currency_List;
  Window_Currency_List.prototype.initialize = function(x, y, width, height) {
    Window_Selectable.prototype.initialize.call(this, x, y, width, height);
  };
  Window_Currency_List.prototype.maxCols = function() {
    return 1;
  };
  Window_Currency_List.prototype.maxItems = function() {
    return this._currencyList ? this._currencyList.length : 0;
  };
  Window_Currency_List.prototype.setCategory = function(category) {
    var categoryData = $dataRainworksCategories[category];
    this._showsGold = false;
    if (categoryData['showsGold'] == true) {
      this._showsGold = true;
      this._currencyList = [{ cap: 0, category: category, id: -1, isVisible: true, name: 'Gold' }];
      this._currencyList = this._currencyList.concat($gameSystem.RainworksGetVisibleCurrencyByCategory(category));
    } else {
      this._currencyList = $gameSystem.RainworksGetVisibleCurrencyByCategory(category);
    }
    this.refresh();
  };

  Window_Currency_List.prototype.refresh = function() {
    this.contents.clear();
    this.createContents();
    this.drawAllItems();
  };

  Window_Currency_List.prototype.drawItem = function(index) {
    var rect = this.itemRectForText(index);

    var amountString = '';
    if (this._showsGold && index == 0) {
      this.drawTextEx($dataSystem.currencyUnit, rect.x, rect.y);
      amountString = $gameParty.gold().toString();
    } else {
      this.drawTextEx(this._currencyList[index]['name'], rect.x, rect.y);
      amountString = $gameSystem.RainworksGetCurrencyAmount(this._currencyList[index]['id'] + 1).toString();
      var cap = $gameSystem.RainworksGetCurrencyCap(this._currencyList[index]['id'] + 1);
      if (parseInt(cap) > 0) amountString += '/' + cap.toString();
    }

    var amountWidth = this.textWidth(amountString);
    this.drawText(amountString, rect.width - amountWidth, rect.y);
  };

  //=============================================================================
  // Scene_Menu
  //=============================================================================

  Rainworks.Currency.Scene_Menu_createCommandWindow = Scene_Menu.prototype.createCommandWindow;
  Scene_Menu.prototype.createCommandWindow = function() {
    Rainworks.Currency.Scene_Menu_createCommandWindow.call(this);
    this._commandWindow.setHandler('currency', this.commandCurrency.bind(this));
  };

  Scene_Menu.prototype.commandCurrency = function() {
    SceneManager.push(Scene_Currency);
  };

  //=============================================================================
  // Scene_Currency
  //=============================================================================

  function Scene_Currency() {
    this.initialize.apply(this, arguments);
  }

  Scene_Currency.prototype = Object.create(Scene_MenuBase.prototype);
  Scene_Currency.prototype.constructor = Scene_Currency;

  Scene_Currency.prototype.initialize = function() {
    Scene_MenuBase.prototype.initialize.call(this);
  };

  Scene_Currency.prototype.create = function() {
    Scene_MenuBase.prototype.create.call(this);
    this._indexWindow = new Window_Currency_Index();
    this._listWindow = new Window_Currency_List(
      0,
      this._indexWindow.height,
      Graphics.width,
      Graphics.height - this._indexWindow.height
    );
    this._indexWindow.setHandler('cancel', this.popScene.bind(this));
    this._indexWindow.setHandler('index_select', this.onCurrencyOk.bind(this));
    this._listWindow.setHandler('cancel', this.cancelList.bind(this));
    this.addWindow(this._indexWindow);
    this.addWindow(this._listWindow);
    this._indexWindow.activate();
    this._indexWindow.setListWindow(this._listWindow);
  };
  Scene_Currency.prototype.onCurrencyOk = function() {
    this._listWindow.activate();
    if (this._listWindow.index() < 0) this._listWindow.select(0);
  };
  Scene_Currency.prototype.cancelList = function() {
    this._indexWindow.activate();
    this._listWindow.deselect();
    this._listWindow.deactivate();
  };
})();
