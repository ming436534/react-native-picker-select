import React, { PureComponent } from 'react';
import {
    Modal,
    Picker,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import PropTypes from 'prop-types';
import isEqual from 'lodash.isequal';

function handlePlaceholder({ placeholder }) {
    if (isEqual(placeholder, {})) {
        return [];
    }
    return [placeholder];
}

function getSelectedItem({ items, value }) {
    return (
        items.find((item) => {
            return isEqual(item.value, value);
        }) || items[0]
    );
}

export default class RNPickerSelect extends PureComponent {
    static getDerivedStateFromProps(nextProps, prevState) {
        // update items if items prop changes
        const itemsChanged = !isEqual(prevState.items, nextProps.items);
        // update selectedItem if value prop is defined and differs from currently selected item
        const newSelectedItem = getSelectedItem({ items: prevState.items, value: nextProps.value });
        const selectedItemChanged =
            !isEqual(nextProps.value, undefined) &&
            !isEqual(prevState.selectedItem, newSelectedItem);

        if (itemsChanged || selectedItemChanged) {
            return {
                items: itemsChanged
                    ? handlePlaceholder({ placeholder: nextProps.placeholder }).concat(
                          nextProps.items
                      )
                    : prevState.items,
                selectedItem: selectedItemChanged ? newSelectedItem : prevState.selectedItem,
            };
        }

        return null;
    }

    constructor(props) {
        super(props);

        const items = handlePlaceholder({ placeholder: props.placeholder }).concat(props.items);
        this.state = {
            items,
            selectedItem: getSelectedItem({ items, value: props.value }),
            showPicker: false,
            animationType: undefined,
        };

        this.onUpArrow = this.onUpArrow.bind(this);
        this.onDownArrow = this.onDownArrow.bind(this);
        this.onValueChange = this.onValueChange.bind(this);
        this.togglePicker = this.togglePicker.bind(this);
    }

    onUpArrow() {
        this.togglePicker();
        setTimeout(() => {
            this.props.onUpArrow();
        });
    }

    onDownArrow() {
        this.togglePicker();
        setTimeout(() => {
            this.props.onDownArrow();
        });
    }

    onValueChange(value, index) {
        this.props.onValueChange(value, index);
        this.togglePicker(true);
        this.setState({
            selectedItem: this.state.items[index],
        });
    }

    togglePicker(animate = true) {
        if (this.props.disabled) {
            return;
        }
        this.props.onTogglePicker && this.props.onTogglePicker(!this.state.showPicker);
        this.setState({
            animationType: animate ? this.props.animationType : undefined,
            showPicker: !this.state.showPicker,
        });
        if (!this.state.showPicker && this.inputRef) {
            this.inputRef.focus();
            this.inputRef.blur();
        }
    }

    renderPickerItems() {
        return this.state.items.map((item) => {
            return (
                <Picker.Item label={item.label} value={item.value} key={item.key || item.label} />
            );
        });
    }

    renderPlaceholderStyle() {
        const styleModifiers = {};
        if (
            !isEqual(this.props.placeholder, {}) &&
            this.state.selectedItem.label === this.props.placeholder.label
        ) {
            styleModifiers.color = this.props.style.placeholderColor || '#C7C7CD';
        }
        return styleModifiers;
    }

    renderDoneBar() {
        if (this.props.hideDoneBar) {
            return null;
        }

        return (
            <View style={[styles.modalViewMiddle, this.props.style.modalViewMiddle]}>
                <View style={{ flex: 1, flexDirection: 'row', marginLeft: 15 }}>
                    <TouchableOpacity
                        activeOpacity={this.props.onUpArrow ? 0.5 : 1}
                        onPress={this.props.onUpArrow ? this.onUpArrow : null}
                    >
                        <View
                            style={[
                                styles.chevron,
                                this.props.style.chevron,
                                styles.chevronUp,
                                this.props.style.chevronUp,
                                this.props.onUpArrow
                                    ? [styles.chevronActive, this.props.style.chevronActive]
                                    : {},
                            ]}
                        />
                    </TouchableOpacity>
                    <View style={{ marginHorizontal: 10 }} />
                    <TouchableOpacity
                        activeOpacity={this.props.onDownArrow ? 0.5 : 1}
                        onPress={this.props.onDownArrow ? this.onDownArrow : null}
                    >
                        <View
                            style={[
                                styles.chevron,
                                this.props.style.chevron,
                                styles.chevronDown,
                                this.props.style.chevronDown,
                                this.props.onDownArrow
                                    ? [styles.chevronActive, this.props.style.chevronActive]
                                    : {},
                            ]}
                        />
                    </TouchableOpacity>
                </View>
                <TouchableWithoutFeedback
                    onPress={() => {
                        this.togglePicker(true);
                    }}
                    hitSlop={{ top: 2, right: 2, bottom: 2, left: 2 }}
                >
                    <View>
                        <Text style={[styles.done, this.props.style.done]}>{this.props.doneText}</Text>
                    </View>
                </TouchableWithoutFeedback>
            </View>
        );
    }

    renderIcon() {
        if (this.props.hideIcon) {
            return null;
        }

        return <View style={[styles.icon, this.props.style.icon]} />;
    }

    renderTextInputOrChildren() {
        if (this.props.children) {
            return <View pointerEvents="box-only">{this.props.children}</View>;
        }
        return (
            <View pointerEvents="box-only">
                <TextInput
                    style={[this.props.style.inputIOS, this.renderPlaceholderStyle()]}
                    value={this.state.selectedItem.label}
                    ref={(ref) => {
                        this.inputRef = ref;
                    }}
                />
                {this.renderIcon()}
            </View>
        );
    }

    renderIOS() {
        return (
            <View style={[styles.viewContainer, this.props.style.viewContainer]}>
                <TouchableWithoutFeedback
                    onPress={() => {
                        this.togglePicker(true);
                    }}
                >
                    {this.renderTextInputOrChildren()}
                </TouchableWithoutFeedback>
                <Modal
                    visible={this.state.showPicker}
                    transparent
                    animationType={this.state.animationType}
                >
                    <TouchableOpacity
                        style={[styles.modalViewTop, this.props.style.modalViewTop]}
                        onPress={() => {
                            this.togglePicker(true);
                        }}
                    />
                    {this.renderDoneBar()}
                    <View style={[styles.modalViewBottom, this.props.style.modalViewBottom]}>
                        <Picker
                            onValueChange={this.onValueChange}
                            selectedValue={this.state.selectedItem.value}
                            testId="RNPickerSelectIOS"
                        >
                            {this.renderPickerItems()}
                        </Picker>
                    </View>
                </Modal>
            </View>
        );
    }

    renderAndroidHeadlessItems() {
        return this.state.items.map((item) => {
            let containerStyle;
            let textStyle;
            if (item.value === this.state.selectedItem.value) {
                containerStyle = [styles.selectedContainer, this.props.style.selectedContainer];
                textStyle = [styles.selectedText, this.props.style.selectedText];
            } else {
                containerStyle = [styles.notSelectedContainer, this.props.style.notSelectedContainer];
                textStyle = [styles.notSelectedText, this.props.style.notSelectedText];
            }
            return (
                <TouchableOpacity
                    key={item.key || item.label}
                    style={containerStyle}
                    onPress={() => {
                        this.onValueChange(item.value);
                    }}
                >
                    <Text style={textStyle}>
                        {item.label}
                    </Text>
                </TouchableOpacity>
            );
        });
    }

    renderAndroidHeadless() {
        // <Picker
        //     style={{ position: 'absolute', top: 0, width: 1000, height: 1000 }}
        //     onValueChange={this.onValueChange}
        //     selectedValue={this.state.selectedItem.value}
        //     testId="RNPickerSelectAndroid"
        //     mode={this.props.mode}
        //     enabled={!this.props.disabled}
        // >
        // {this.renderPickerItems()}
        return (
            <View style={[styles.viewContainer, this.props.style.viewContainer]}>
                <TouchableWithoutFeedback
                    onPress={() => {
                        this.togglePicker(true);
                    }}
                >
                    {this.renderTextInputOrChildren()}
                </TouchableWithoutFeedback>
                <Modal
                    visible={this.state.showPicker}
                    animationType="fade"
                    transparent
                    onRequestClose={() => {
                        this.togglePicker(false);
                    }}
                >
                    <View
                        style={[styles.modalBackground, this.props.style.modalBackground]}
                    >
                        <TouchableOpacity
                            style={{flex: 1, justifyContent: 'center'}}
                            onPress={() => {
                                this.togglePicker(true);
                            }}
                            activeOpacity={1}
                        >
                            <View style={{backgroundColor: 'white', paddingVertical: 12}}>
                                {
                                    (this.props.title) ?
                                        <Text style={[styles.title, this.props.style.title]}>{this.props.title}</Text> : null
                                }
                                <View style={[styles.itemsContainer, this.props.itemsContainer]}>
                                    {this.renderAndroidHeadlessItems()}
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>
                </Modal>
            </View>
        );
    }

    renderAndroid() {
        if (this.props.children) {
            return this.renderAndroidHeadless();
        }

        return (
            <View style={[styles.viewContainer, this.props.style.viewContainer]}>
                <Picker
                    style={[this.props.style.inputAndroid, this.renderPlaceholderStyle()]}
                    onValueChange={this.onValueChange}
                    selectedValue={this.state.selectedItem.value}
                    testId="RNPickerSelectAndroid"
                    mode={this.props.mode}
                    enabled={!this.props.disabled}
                >
                    {this.renderPickerItems()}
                </Picker>
                <View style={[styles.underline, this.props.style.underline]} />
            </View>
        );
    }

    render() {
        return Platform.OS === 'ios' ? this.renderIOS() : this.renderAndroid();
    }
}

RNPickerSelect.propTypes = {
    title: PropTypes.string,
    onTogglePicker: PropTypes.func,
    onValueChange: PropTypes.func.isRequired,
    items: PropTypes.arrayOf(
        PropTypes.shape({
            label: PropTypes.string.isRequired,
            value: PropTypes.any.isRequired,
            key: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        })
    ).isRequired,
    placeholder: PropTypes.shape({
        label: PropTypes.string,
        value: PropTypes.any,
    }),
    hideDoneBar: PropTypes.bool,
    hideIcon: PropTypes.bool,
    disabled: PropTypes.bool,
    value: PropTypes.any, // eslint-disable-line react/forbid-prop-types
    style: PropTypes.object, // eslint-disable-line react/forbid-prop-types
    children: PropTypes.any, // eslint-disable-line react/forbid-prop-types
    mode: PropTypes.string,
    animationType: PropTypes.string,
    onUpArrow: PropTypes.func,
    onDownArrow: PropTypes.func,
};

RNPickerSelect.defaultProps = {
    placeholder: {
        label: 'Select an item...',
        value: null,
    },
    hideDoneBar: false,
    hideIcon: false,
    disabled: false,
    value: undefined,
    style: {},
    children: null,
    mode: 'dialog',
    animationType: 'slide',
    onUpArrow: null,
    onDownArrow: null,
};

const styles = StyleSheet.create({
    viewContainer: {
        alignSelf: 'stretch',
    },
    chevron: {
        width: 15,
        height: 15,
        backgroundColor: 'transparent',
        borderTopWidth: 1.5,
        borderTopColor: '#D0D4DB',
        borderRightWidth: 1.5,
        borderRightColor: '#D0D4DB',
    },
    chevronUp: {
        transform: [{ translateY: 17 }, { rotate: '-45deg' }],
    },
    chevronDown: {
        transform: [{ translateY: 8 }, { rotate: '135deg' }],
    },
    chevronActive: {
        borderTopColor: '#007AFE',
        borderRightColor: '#007AFE',
    },
    icon: {
        position: 'absolute',
        backgroundColor: 'transparent',
        borderTopWidth: 10,
        borderTopColor: 'gray',
        borderRightWidth: 10,
        borderRightColor: 'transparent',
        borderLeftWidth: 10,
        borderLeftColor: 'transparent',
        width: 0,
        height: 0,
        top: 20,
        right: 10,
    },
    modalViewTop: {
        flex: 1,
    },
    modalViewMiddle: {
        height: 44,
        zIndex: 2,
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#EFF1F2',
        borderTopWidth: 0.5,
        borderTopColor: '#919498',
    },
    modalViewBottom: {
        height: 215,
        justifyContent: 'center',
        backgroundColor: '#D0D4DB',
    },
    done: {
        color: '#007AFE',
        fontWeight: 'bold',
        padding: 10,
        fontSize: 18,
    },
    underline: {
        borderTopWidth: 1,
        borderTopColor: '#888988',
        marginHorizontal: 4,
    },
    selectedContainer: {flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 10, backgroundColor: 'white'},
    selectedText: {fontSize: 18},
    notSelectedContainer: {flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 10, backgroundColor: 'white'},
    notSelectedText: {fontSize: 18},
    modalBackground: {backgroundColor: '#000000AA', flex: 1, paddingHorizontal: 32},
    itemsContainer: {
        paddingVertical: 12,
    },
    title: {
        fontSize: 20,
        paddingBottom: 10,
        paddingHorizontal: 8,
        borderBottomWidth: 0.5,
        borderColor: '#00000040',
        fontWeight: '300',
    },
});
