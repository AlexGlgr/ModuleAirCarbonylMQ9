const ClassMiddleSensor = require('ClassSensor.min.js');
/**
 * @class
 * Модуль реализует базовые функции датчика MQ-9,
 * возращающего данные о концентрации угарного газа в воздухе
 */
class ClassAirCarbonylMQ9 extends ClassMiddleSensor {
    /**
     * @constructor
     * @param {Object} _opts   - Объект с параметрами по нотации ClassMiddleSensor
     */
    constructor(_opts, _sensor_props) {
        ClassMiddleSensor.apply(this, [_opts, _sensor_props]);
        this._Name = 'ClassAirCarbonylMQ9'; //переопределяем имя типа
		this._Sensor = require('BaseClassMQX.min.js').connect({dataPin: _opts.pins[0], heatPin: _opts.pins[1], model: 'MQ9', r0: _opts.baseline});
        this._MinPeriod = 250;
        this._UsedChannels = [];
        this._Interval;
        this._CanRead = true;
        this.Init(_sensor_props);
    }
    /**
     * @method
     * Инициализирует датчик
     */
    Init(_sensor_props) {
        super.Init(_sensor_props);
    }
    /**
     * @method
     * Управление нагревателем датчика
     * @param {Number} _val   - Значение от 0 до 1, где 1 - нагрев на максимально возможную температуру,
     * а 0 - выключение нагревателя.
     */
    ControlHeater(_val)
    {
        this._Sensor.heat(_val);
    }
    /**
     * @method
     * Запускает датчик на полный прогрев в течении 30 секнуд. 
     * В этот период нельзя читать данные с датчика.
     * По окончанию нагрева выводтися сообщение.
     * Нагреватель остаётся включенным.
     */
    Preheat()
    {
        this._CanRead = false;
        console.log("Beginning to preheat MQ-9...");
        this._Sensor.preheat(() => {
            console.log("MQ-9 is heated!");
            this._CanRead = true;
        });
    }
    /**
     * @method
     * Запускает датчик на калибровку - определяет базовое значение
     * концентрации угарного газа в воздухе
     * @param {Number} _val   - Значение для калибровки, необязательный параметр
     */
    Calibrate(_val)
    {
        this._Sensor.calibrate(_val);
    }
    /**
     * @method
     * Запускает сбор данных с датчика и передачи их в каналы
     * @param {Number} _period          - частота опроса (минимум 250 мс)
     * @param {Number} _num_channel     - номер канала
     */
    Start(_num_channel, _period) {
        let period = (typeof _period === 'number' & _period >= this._MinPeriod) ? _period    //частота сверяется с минимальной
                 : this._MinPeriod;
        if (!this._UsedChannels.includes(_num_channel)) this._UsedChannels.push(_num_channel); //номер канала попадает в список опрашиваемых каналов. Если интервал уже запущен с таким же периодои, то даже нет нужды его перезапускать 
        if (!this._Interval) {          //если в данный момент не ведется ни одного опроса
            this._Interval = setInterval(() => {
                if (this._UsedChannels.includes(0)) this.Ch0_Value = this._CanRead ? this._Sensor.read('CO') : 0;
            }, period);
        }
    }
    /**
     * @method
     * Меняет частоту опроса датчика
     * @param {Number} freq     - новая частота опроса (минимум 1000 мс)
     */
    ChangeFreq(_num_channel, freq) {
        clearInterval(this._Interval);
        setTimeout(() => this.Start(freq), this._Minfrequency);
    }
    /**
     * @method
     * Меняет режим работы датчика через 10 секунд
     * @param {Object} _opts    - объект, содержащий новый режим датчика
     */
    ConfigureRegs(_opts) {
        if (Number.isInteger(_opts.mode) && _opts.mode >= 0 && _opts.mode <= 4) {
            this._CanRead = false;
            setTimeout (() => {
                this._Sensor.setMode(_opts.mode);
            }, 10000);
            this._CanRead = true;
        }   
    }
    /**
     * @methhod
     * Останавливает сбор данных с датчика
     * @param {Number} _num_channel   - номер канала, в который должен быть остановлен поток данных
     */
    Stop(_num_channel) {
        if (_num_channel) this._UsedChannels.splice(this._UsedChannels.indexOf(_num_channel));
        else {
            this._UsedChannels = [];
            clearInterval(this._Interval);
            this._Interval = null;
        }
    }
}
	

exports = ClassAirCarbonylMQ9;