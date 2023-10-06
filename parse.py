from bs4 import BeautifulSoup
import os
import requests
import argparse

image_folder_name = 'img'

def process_html(input_file, output_file):
    with open(input_file, 'r', encoding='utf-8') as file:
        html_content = file.read()
    image_folder = os.path.join(os.path.dirname(output_file), image_folder_name)
    os.makedirs(image_folder, exist_ok=False)

    soup = BeautifulSoup(html_content, 'html.parser')

    # 处理标题
    for p_tag in soup.find_all('p'):
        class_attr = p_tag.get('class')
        if class_attr:
            for class_name in class_attr:
                if class_name.startswith('headline-level-'):
                    x = class_name.split('-')[-1]
                    new_tag = soup.new_tag(f'h{x}')
                    new_tag.string = p_tag.get_text()
                    p_tag.replace_with(new_tag)

    # 处理<img>标签
    for img_tag in soup.find_all('img'):
        img_url = img_tag.get('data-orig-src', '')
        img_name = os.path.basename(img_url)
        img_path = os.path.join(image_folder, img_name)
        response = requests.get(img_url)
        with open(img_path, 'wb') as img_file:
            img_file.write(response.content)
        img_tag.attrs = {'src': os.path.join(image_folder_name, img_name), 'height': img_tag.get('height', ''), 'width': img_tag.get('width', '')}

    # 删除包含aria-hidden="true"的标签
    deleted_tags = []
    for tag in soup.find_all("span", {"aria-hidden": "true"}):
        print(tag)
        deleted_tags.append(tag)
        tag.extract()

    # 输出删除标签的信息
    for tag in deleted_tags:
        tag_name = tag.name
        class_name = tag.get('class', '')
        print(f'Deleted tag: {tag_name}, class: {class_name}')

    with open(output_file, 'w', encoding='utf-8') as outfile:
        outfile.write(soup.prettify())

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Process HTML file")
    parser.add_argument("input_file", help="Input HTML file path")
    parser.add_argument("output_file", help="Output HTML file path")
    args = parser.parse_args()

    input_file = args.input_file
    output_file = args.output_file

    process_html(input_file, output_file)